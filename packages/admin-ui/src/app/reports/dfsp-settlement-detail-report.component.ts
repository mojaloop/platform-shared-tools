import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription } from "rxjs";
import moment from "moment";
import * as XLSX from "xlsx";
import {
	HUB_PARTICIPANT_ID,
	IParticipant,
} from "@mojaloop/participant-bc-public-types-lib";

import { UnauthorizedError } from "../_services_and_types/errors";
import { MessageService } from "../_services_and_types/message.service";
import { ParticipantsService } from "../_services_and_types/participants.service";
import { ReportService } from "../_services_and_types/report.service";
import type { MatrixId } from "../_services_and_types/report_types";
import type { SettlementInfo } from "./dfsp-settlement-report.component";
import { formatCommaSeparator } from "../_utils";

interface ModifiedDetailReport {
	matrixId: string;
	settlementDate: string;
	payerFspId: string;
	payerParticipantName: string;
	payeeFspId: string;
	payeeParticipantName: string;
	journalEntryId: string;
	transactionType: string;
	transactionDate: string;
	payerIdType: string;
	payerIdentifier: string;
	payeeIdType: string;
	payeeIdentifier: string;
	sentAmount: string;
	receivedAmount: string;
	currency: string;
}

@Component({
	selector: "app-dfsp-settlement-detail-report",
	templateUrl: "./dfsp-settlement-detail-report.component.html",
})
export class DFSPSettlementDetailReport implements OnInit {
	public dfspFilterForm!: FormGroup;
	public settlementIdForm!: FormGroup;

	showSettlementIdForm: boolean = false;
	showResults: boolean = false;
	chosenDfspId: string = "";
	chosenSettlementId: string = "";
	settlementInfo: SettlementInfo | null = null;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<
		IParticipant[]
	>([]);
	participantsSubs?: Subscription;

	matrixIds: BehaviorSubject<MatrixId[]> = new BehaviorSubject<MatrixId[]>(
		[]
	);
	matrixIdsSubs?: Subscription;

	detailReports: BehaviorSubject<ModifiedDetailReport[]> =
		new BehaviorSubject<ModifiedDetailReport[]>([]);
	detailReportsSubs?: Subscription;
	currentLocalTimeZoneOffset: string = "";

	constructor(
		private _participantsSvc: ParticipantsService,
		private _reportSvc: ReportService,
		private _messageService: MessageService
	) {}

	async ngOnInit(): Promise<void> {
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
		if (this.detailReportsSubs) {
			this.detailReportsSubs.unsubscribe();
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

	getDetailReports(participantId: string, matrixId: string) {
		this.detailReportsSubs = this._reportSvc
			.getAllSettlementDetailReports(participantId, matrixId)
			.subscribe(
				(result) => {
					if (result.length > 0) {
						const formattedDate = new Date(
							result[0].settlementDate
						).toISOString();
						const chosenDfsp = this.participants.value.find(
							(value) => value.id === this.chosenDfspId
						);

						this.settlementInfo = {
							settlementId: result[0].matrixId,
							settlementCreatedDate: formattedDate,
							dfspId: chosenDfsp?.id || "",
							dfspName: chosenDfsp?.name || "",
						};
					} else {
						this.settlementInfo = null;
					}

					const detailReports = result.map((detailReport) => ({
						...detailReport,
						transactionDate: new Date(
							detailReport.transactionDate
						).toISOString(),
						sentAmount:
							this.chosenDfspId === detailReport.payerFspId
								? formatCommaSeparator(detailReport.Amount)
								: "0",
						receivedAmount:
							this.chosenDfspId === detailReport.payeeFspId
								? formatCommaSeparator(detailReport.Amount)
								: "0",
						currency: detailReport.Currency,
					}));
					this.detailReports.next(detailReports);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
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
		this.detailReports.next([]);
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

		this.getDetailReports(this.chosenDfspId, settlementId);
		this.chosenSettlementId = settlementId;
		this.showResults = true;
		this.currentLocalTimeZoneOffset = this.getTimezoneOffset();
	}

	getTimezoneOffset(): string {
		const offset = moment().format('Z'); // e.g., +05:30 or -04:00
		return `UTC${offset}`;
	}

	downloadDetailReport() {
		const data = [
			[
				"Sender DFSP ID",
				"Sender DFSP Name",
				"Receiver DFSP ID",
				"Receiver DFSP Name",
				"Transfer ID",
				"Tx Type",
				"Transaction Date",
				"Sender ID Type",
				"Sender ID",
				"Receiver ID Type",
				"Receiver ID",
				"Received Amount",
				"Sent Amount",
				"Fee",
				"Currency",
			],
		];
		this.detailReports.value.forEach((detailReport) => {
			data.push([
				detailReport.payerFspId,
				detailReport.payerParticipantName,
				detailReport.payeeFspId,
				detailReport.payeeParticipantName,
				detailReport.journalEntryId,
				detailReport.transactionType,
				detailReport.transactionDate,
				detailReport.payerIdType,
				detailReport.payerIdentifier,
				detailReport.payeeIdType,
				detailReport.payeeIdentifier,
				detailReport.receivedAmount,
				detailReport.sentAmount,
				"-",
				detailReport.currency,
			]);
		});

		// Create a new workbook
		const wb = XLSX.utils.book_new();

		// Add a worksheet to the workbook
		const ws = XLSX.utils.aoa_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");

		// Save the workbook as an Excel file
		XLSX.writeFile(wb, `detail-report-${this.chosenSettlementId}.xlsx`);
	}

	downloadDFSPSettlementDetailReport() {
		const settlementId = this.settlementIdForm.controls.settlementId.value;
		const dfspId = this.chosenDfspId;
		const offset = this.currentLocalTimeZoneOffset;
		this._reportSvc
			.exportSettlementDetailReport(dfspId,settlementId,offset)
			.subscribe(
				(data) => {
					const formattedDate = moment(new Date()).format("DDMMMYYYY");
					const url = URL.createObjectURL(data);
					const link = document.createElement("a");
					link.href = url;
					link.setAttribute(
						"download",
						`DFSPSettlementDetailReport-${formattedDate}.xlsx`
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
