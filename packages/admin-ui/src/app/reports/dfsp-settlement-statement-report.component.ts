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
import { formatNumber } from "../_utils";
import { ParticipantFundsMovementTypes } from "@mojaloop/participant-bc-public-types-lib";
import { PlatformConfigService } from "../_services_and_types/platform-config.service";
import {Currency} from "@mojaloop/platform-configuration-bc-public-types-lib";

interface ModifiedStatementReport {
	dfspId: string;
	dfspName: string;
	fromDate: string;
	toDate: string;
	currencyCode: string;
	transferId: string;
	transactionDate: string;
	processDescription: string;
	fundsInAmount: string;
	fundsOutAmount: string;
	openingAmount :string;
	balance: string;
	statementCurrencyCode: string;
	accountNumber: string;
	amount :number;
}

interface SettlementStatementInfo {
	dfspId: string;
	dfspName: string;
	startDate :string;
	endDate: string;
	currencyCode: string;
}

@Component({
	selector: "app-dfsp-settlement-statement-report",
	templateUrl: "./dfsp-settlement-statement-report.component.html",
})
export class DFSPSettlementStatementReport implements OnInit {
	public dfspFilterForm!: FormGroup;

	showResults: boolean = false;
	chosenDfspId: string = "";
	chosenSettlementId: string = "";
	settlementStatementInfo: SettlementStatementInfo | null = null;
	currencyCodeList : BehaviorSubject<Currency[]> = new BehaviorSubject<Currency[]>([]);

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<
		IParticipant[]
	>([]);
	participantsSubs?: Subscription;
	platformConfigSubs ?: Subscription;

	statementReports: BehaviorSubject<ModifiedStatementReport[]> =
		new BehaviorSubject<ModifiedStatementReport[]>([]);
	statementReportsSub?: Subscription;
	currentLocalTimeZoneOffset: string = "";

	constructor(
		private _participantsSvc: ParticipantsService,
		private _reportSvc: ReportService,
		private _messageService: MessageService,
		private _platformConfigSvc: PlatformConfigService
	) {}

	async ngOnInit(): Promise<void> {
		this._initForms();
		this.getParticipants();
		this.getCurrencyList();
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
		if (this.statementReportsSub) {
			this.statementReportsSub.unsubscribe();
		}
	}

	private _initForms() {
		this.dfspFilterForm = new FormGroup({
			dfspName: new FormControl("", [Validators.required]),
			startDate: new FormControl("", [Validators.required]),
			endDate: new FormControl("", [Validators.required]),
			currencyCode: new FormControl("", Validators.required)
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

	getCurrencyList(){
		this.platformConfigSubs = this._platformConfigSvc.getLatestGlobalConfig().subscribe((globalConfig) => {
			
			const currencies : Currency[] = globalConfig.parameters.find(param => param.name === "CURRENCIES")?.currentValue;
			
			this.currencyCodeList.next(currencies);
	
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		})
	}

	formatDatetoISOString(value : any){
		return new Date(value).toISOString().replace(/\.\d+Z$/, '+00:00');
	}

	getSettlementStatementReports(participantId: string, startDate: number, endDate: number, currencyCode: string) {
		this.statementReportsSub = this._reportSvc
			.getAllSettlementStatementReports(participantId, startDate, endDate, currencyCode)
			.subscribe(
				(result) => {
					if (result.length > 0) {
						const chosenDfsp = this.participants.value.find(
							(value) => value.id === this.chosenDfspId
						);

						this.settlementStatementInfo = {
							dfspId: chosenDfsp?.id || "",
							dfspName: chosenDfsp?.name || "",
							startDate : this.formatDatetoISOString( startDate ),
							endDate: this.formatDatetoISOString( endDate ),
							currencyCode: currencyCode
						};
					} else {
						this.settlementStatementInfo = null;
					}

					const statementReports = result.map((detailReport) => ({
						...detailReport,
						transactionDate: this.formatDatetoISOString(detailReport.transactionDate),
						fundsInAmount: detailReport.fundsInAmount ? formatNumber(detailReport.fundsInAmount) : "0.00",
						fundsOutAmount: detailReport.fundsOutAmount ? formatNumber(detailReport.fundsOutAmount) : "0.00",
						currencyCode: detailReport.currencyCode,
						balance :detailReport.balance ? formatNumber(detailReport.balance) : "0.00"
					}));
					this.statementReports.next(statementReports);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}else{
						this.settlementStatementInfo = null;
						this.statementReports = new BehaviorSubject<ModifiedStatementReport[]>([]);
					}
				}
			);
	}

	searchReports() {
		if (!this.dfspFilterForm.valid) {
			this._messageService.addError("Fill all the required fields!");
			return;
		}

		const dfspId = this.dfspFilterForm.controls.dfspName.value;
		this.chosenDfspId = dfspId;

		const startDate = this.dfspFilterForm.controls.startDate.value;
		const endDate = this.dfspFilterForm.controls.endDate.value;
		const startDateTimestamp = new Date(startDate).getTime();
		const endDateTimestamp = new Date(endDate).getTime();
		const currencyCode = this.dfspFilterForm.controls.currencyCode.value;
		this.currentLocalTimeZoneOffset = this.getTimezoneOffset();
		this.getSettlementStatementReports(this.chosenDfspId, startDateTimestamp, endDateTimestamp, currencyCode);
		this.showResults = true;
	}

	getTimezoneOffset(): string {
		const offset = moment().format('Z'); // e.g., +05:30 or -04:00
		return `UTC${offset}`;
	}

	downloadDFSPSettlementStatementReport() {
		const dfspId = this.chosenDfspId;
		const startDate = this.dfspFilterForm.controls.startDate.value;
		const endDate = this.dfspFilterForm.controls.endDate.value;
		const startDateTimestamp = new Date(startDate).getTime();
		const endDateTimestamp = new Date(endDate).getTime();
		const currencyCode = this.dfspFilterForm.controls.currencyCode.value;
		const offset = this.currentLocalTimeZoneOffset;

		this._reportSvc
			.exportSettlementStatementReport(dfspId, startDateTimestamp, endDateTimestamp, currencyCode, offset)
			.subscribe(
				(data) => {
					const formattedDate = moment(new Date()).format("DDMMMYYYY");
					const url = URL.createObjectURL(data);
					const link = document.createElement("a");
					link.href = url;
					link.setAttribute(
						"download",
						`DFSPSettlementStatementReport-${formattedDate}.xlsx`
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
