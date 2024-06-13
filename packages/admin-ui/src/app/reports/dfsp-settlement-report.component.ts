import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription } from "rxjs";
import moment from "moment";
import {
	HUB_PARTICIPANT_ID,
	IParticipant,
} from "@mojaloop/participant-bc-public-types-lib";

import { UnauthorizedError } from "../_services_and_types/errors";
import { MessageService } from "../_services_and_types/message.service";
import { ParticipantsService } from "../_services_and_types/participants.service";
import { ReportService } from "../_services_and_types/report.service";
import type { MatrixId, Report } from "../_services_and_types/report_types";
import { formatCommaSeparator, getMaxDecimalPlaces } from "../_utils";

interface ModifiedReport
	extends Omit<Report, "totalAmountSent" | "totalAmountReceived"> {
	totalAmountSent: string;
	totalAmountReceived: string;
	totalTransactionCount: number;
	totalAmount: string;
	netPosition: string;
}

export interface SettlementInfo {
	settlementId: string;
	settlementCreatedDate: string;
	dfspId: string;
	dfspName: string;
}

@Component({
	selector: "app-dfsp-settlement-report",
	templateUrl: "./dfsp-settlement-report.component.html",
})
export class DFSPSettlementReport implements OnInit {
	public dfspFilterForm!: FormGroup;
	public settlementIdForm!: FormGroup;

	showSettlementIdForm: boolean = false;
	showResults: boolean = false;
	chosenDfspId: string = "";
	chosenSettlementId: string = "";
	settlementInfo: SettlementInfo | null = null;
	aggregatedNetPositions: any;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<
		IParticipant[]
	>([]);
	participantsSubs?: Subscription;

	matrixIds: BehaviorSubject<MatrixId[]> = new BehaviorSubject<MatrixId[]>(
		[]
	);
	matrixIdsSubs?: Subscription;

	reports: BehaviorSubject<ModifiedReport[]> = new BehaviorSubject<
		ModifiedReport[]
	>([]);
	reportSubs?: Subscription;
	currentLocalTimeZoneOffset: string = "";

	constructor(
		private _participantsSvc: ParticipantsService,
		private _reportSvc: ReportService,
		private _messageService: MessageService
	) {}

	ngOnInit() {
		this._initForms();
		this.getParticipants();
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
		if (this.matrixIdsSubs) {
			this.matrixIdsSubs.unsubscribe();
		}
		if (this.reportSubs) {
			this.reportSubs.unsubscribe();
		}
	}

	private _initForms() {
		this.dfspFilterForm = new FormGroup({
			dfspName: new FormControl("", [Validators.required]),
			startDate: new FormControl("", [Validators.required]),
			endDate: new FormControl("", [Validators.required]),
		});

		this.settlementIdForm = new FormGroup({
			settlementId: new FormControl("", [Validators.required]),
		});
	}

	getTimezoneOffset(): string {
		const offset = moment().format('Z'); // e.g., +05:30 or -04:00
		return `UTC${offset}`;
	}

	getParticipants() {
		this.participantsSubs = this._participantsSvc
			.getAllParticipants()
			.subscribe(
				(result) => {
					const onlyDfsps = result.items.filter(
						(value) => value.id !== HUB_PARTICIPANT_ID
					);

					this.participants.next(onlyDfsps);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	getMatrixIds(participantId: string, startDate: number, endDate: number) {
		this.matrixIdsSubs = this._reportSvc
			.getAllSettlementMatrixIds(participantId, startDate, endDate)
			.subscribe(
				(result) => {
					this.matrixIds.next(result);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	getReports(participantId: string, matrixId: string) {
		this.reportSubs = this._reportSvc
			.getAllSettlementReports(participantId, matrixId)
			.subscribe(
				(result) => {
					if (result.length > 0) {
						const formattedDate = new Date(
							result[0].settlementDate
						).toISOString();

						this.settlementInfo = {
							settlementId: result[0].matrixId,
							settlementCreatedDate: formattedDate,
							dfspId: result[0].paramParticipantId,
							dfspName: result[0].paramParticipantName,
						};
					} else {
						this.settlementInfo = null;
					}

					const reports = result.map((report) => ({
						...report,
						totalAmountSent: formatCommaSeparator(report.totalAmountSent),
						totalAmountReceived: formatCommaSeparator(
							report.totalAmountReceived
						),
						totalTransactionCount:
							report.totalSentCount + report.totalReceivedCount,
						totalAmount: formatCommaSeparator(
							this.calculateTotalAmount(report.totalAmountSent , report.totalAmountReceived)
						),
						netPosition: this.calculateNetPosition(
							report.totalAmountReceived, report.totalAmountSent, true
						),
					}));

					const aggregatedNetAmountByCurrency = reports.reduce((accumulator: { currencyCode: string; value: number }[], dataRow:ModifiedReport ) => {
							const { currency } = dataRow;
							const index = accumulator.findIndex(item => item.currencyCode === currency);
							
							const receivedAmountWithoutCommas = dataRow.totalAmountReceived.replace(/,/g, '');
							const sentAmountWithoutCommas = dataRow.totalAmountSent.replace(/,/g, '');
						
							const netPositionValue = Number(this.calculateNetPosition(Number(receivedAmountWithoutCommas),Number(sentAmountWithoutCommas), false));	
							if (index === -1) {
								accumulator.push({ currencyCode: currency, value: netPositionValue });
							} else {
								accumulator[index].value = Number(this.calculateTotalAmount(accumulator[index].value, netPositionValue));
							}
							return accumulator;
					}, [] as { currencyCode: string; value: number }[]);

					this.aggregatedNetPositions =  aggregatedNetAmountByCurrency.map(item => {
						return {
							currencyCode: item.currencyCode,
							value: formatCommaSeparator(item.value)
						};
					});					
					this.reports.next(reports);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	calculateTotalAmount(amount1: number,amount2: number):string {
		const totalAmount = amount1 + amount2;
		const decimalForSettlment = getMaxDecimalPlaces(amount1, amount2);
		return totalAmount.toFixed(decimalForSettlment);
	}

	calculateNetPosition(totalAmountReceived: number, totalAmountSent: number, isFormat:boolean):string {
		const netPosition = totalAmountReceived - totalAmountSent;
		const decimalForSettlment = getMaxDecimalPlaces(totalAmountReceived, totalAmountSent);
		if(isFormat) return this.formatNetPosition(netPosition.toFixed(decimalForSettlment));
		return netPosition.toFixed(decimalForSettlment);
	}

	// to format net postion in UI
	formatNetPosition(netPosition: number| string) {
		return Number(netPosition) < 0
			? `(${formatCommaSeparator(netPosition.toString().replace("-", ""))})`
			: formatCommaSeparator(netPosition);
	}

	searchSettlementIds() {
		this.resetReportOnSettlementChange(false);

		if (!this.dfspFilterForm.valid) {
			this._messageService.addError("Fill all the required fields!");
			return;
		}

		const dfspId = this.dfspFilterForm.controls.dfspName.value;
		const startDate = this.dfspFilterForm.controls.startDate.value;
		const endDate = this.dfspFilterForm.controls.endDate.value;
		const startDateTimestamp = new Date(startDate).getTime();
		const endDateTimestamp = new Date(endDate).getTime();

		this.getMatrixIds(dfspId, startDateTimestamp, endDateTimestamp);
		this.showSettlementIdForm = true;
		this.chosenDfspId = dfspId;
	}

	resetReportOnSettlementChange(isSelectedSettmentIdChange: boolean){
		this.settlementInfo = null;
		this.reports.next([]);
		this.aggregatedNetPositions = null;
		this.showResults = false;
		if(!isSelectedSettmentIdChange){
			this.showSettlementIdForm = false;
			this.matrixIds.next([]);
			this.settlementIdForm = new FormGroup({
				settlementId: new FormControl(""),
			});
		}
	}

	onSettlementIdChange(){
		this.resetReportOnSettlementChange(true);
	}

	searchReports() {
		if (!this.settlementIdForm.valid) {
			this._messageService.addError("Settlement ID is required!");
			return;
		}

		const settlementId = this.settlementIdForm.controls.settlementId.value;

		this.getReports(this.chosenDfspId, settlementId);
		this.chosenSettlementId = settlementId;
		this.showResults = true;
		this.currentLocalTimeZoneOffset = this.getTimezoneOffset();
	}

	downloadDFSPSettlementReport() {
		const settlementId = this.settlementIdForm.controls.settlementId.value;
		const dfspId = this.chosenDfspId;
		const offset = this.currentLocalTimeZoneOffset;
		this._reportSvc
			.exportSettlementReport(dfspId,settlementId,offset)
			.subscribe(
				(data) => {
					const formattedDate = moment(new Date()).format("DDMMMYYYY");
					const url = URL.createObjectURL(data);
					const link = document.createElement("a");
					link.href = url;
					link.setAttribute(
						"download",
						`DFSPSettlementReport-${formattedDate}.xlsx`
					);
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					// Revoke the Object URL when it's no longer needed
					URL.revokeObjectURL(url);
				},
				(error) => {
					this._messageService.addError(error.message);
				}
			);
	}
}
