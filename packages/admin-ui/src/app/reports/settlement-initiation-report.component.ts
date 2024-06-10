import * as moment from 'moment-timezone';
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription } from "rxjs";
import { MessageService } from "../_services_and_types/message.service";
import { ReportService } from "../_services_and_types/report.service";
import type { SettlementInfo } from "./dfsp-settlement-report.component";
import { formatNumber } from "../_utils";

interface ModifiedInitiationReport {
	participantId: string;
	participantBankIdentifier: string;
	balance: string;
	settlementTransfer: string;
	currency: string;
}

@Component({
	selector: "app-settlement-initiation-report",
	templateUrl: "./settlement-initiation-report.component.html",
})
export class SettlementInitiationReport implements OnInit {
	public settlementIdForm!: FormGroup;

	showResults: boolean = false;
	chosenSettlementId: string = "";
	settlementInfo: Omit<SettlementInfo, "dfspId" | "dfspName"> | null = null;

	initiationReports: BehaviorSubject<ModifiedInitiationReport[]> =
		new BehaviorSubject<ModifiedInitiationReport[]>([]);
	initiationReportsSubs?: Subscription;
	currentLocalTimeZoneOffset: string = "";

	constructor(
		private _reportSvc: ReportService,
		private _messageService: MessageService
	) {}

	async ngOnInit(): Promise<void> {
		this._initForms();
	}

	ngOnDestroy() {
		if (this.initiationReportsSubs) {
			this.initiationReportsSubs.unsubscribe();
		}
	}

	private _initForms() {
		this.settlementIdForm = new FormGroup({
			settlementId: new FormControl("", [Validators.required]),
		});
	}

	getTimezoneOffset(): string {
		const offset = moment().format('Z'); // e.g., +05:30 or -04:00
		return `UTC${offset}`;
	}

	getInitiationReports(matrixId: string) {
		this.initiationReportsSubs = this._reportSvc
			.getAllSettlementInitiationReportsByMatrixId(matrixId)
			.subscribe(
				(result) => {
					const formattedDate = new Date(
						result[0].settlementCreatedDate
					).toISOString();

					this.settlementInfo = {
						settlementId: result[0].matrixId,
						settlementCreatedDate: formattedDate,
					};

					const initiationReports = result.map((initiationReport) => {
						const settlementTransfer = (
							Number(initiationReport.participantDebitBalance) -
							Number(initiationReport.participantCreditBalance)
						).toString();

						return {
							participantId: initiationReport.participantId,
							participantBankIdentifier:
								initiationReport.externalBankAccountName +
								initiationReport.externalBankAccountId,
							balance: "",
							settlementTransfer:
								formatNumber(settlementTransfer),
							currency: initiationReport.participantCurrencyCode,
						};
					});

					this.initiationReports.next(initiationReports);
					this.showResults = true;
				},
				(error) => {
					this._messageService.addError(error);
					this.showResults = false;
				}
			);
	}

	searchReports() {
		if (!this.settlementIdForm.valid) {
			this._messageService.addError("Settlement ID is required!");
			return;
		}

		const settlementId = this.settlementIdForm.controls.settlementId.value;
		this.getInitiationReports(settlementId);
		this.chosenSettlementId = settlementId;
		this.currentLocalTimeZoneOffset = this.getTimezoneOffset();
	}

	downloadInitiationReport() {
		this._reportSvc
			.exportSettlementInitiationByMatrixId(this.chosenSettlementId, this.currentLocalTimeZoneOffset)
			.subscribe(
				(data) => {
					const url = URL.createObjectURL(data);
					const link = document.createElement("a");
					link.href = url;
					link.setAttribute(
						"download",
						`initiation-report-${this.chosenSettlementId}.xlsx`
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
