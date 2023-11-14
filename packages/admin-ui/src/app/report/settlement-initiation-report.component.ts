import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription } from "rxjs";
import moment from "moment";
import * as XLSX from "xlsx";

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

	getInitiationReports(matrixId: string) {
		this.initiationReportsSubs = this._reportSvc
			.getAllSettlementInitiationReportsByMatrixId(matrixId)
			.subscribe(
				(result) => {
					const formattedDate = moment(
						result[0].settlementCreatedDate
					).format("DD-MMM-YYYY hh:mm:ss A");

					this.settlementInfo = {
						settlementId: result[0].matrixId,
						settlementCreatedDate: formattedDate,
					};

					const initiationReports = result.map((initiationReport) => {
						const settlementTransfer = (
							Number(initiationReport.participantCreditBalance) -
							Number(initiationReport.participantDebitBalance)
						).toString();

						return {
							participantId: initiationReport.participantId,
							participantBankIdentifier:
								initiationReport.externalBankAccountId +
								initiationReport.externalBankAccountName,
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
	}

	downloadInitiationReport() {
		const data = [
			[
				"Participant",
				"Participant (Bank Identifier)",
				"Balance",
				"Settlement Transfer",
				"Currency",
			],
		];
		this.initiationReports.value.forEach((initiationReport) => {
			data.push([
				initiationReport.participantId,
				initiationReport.participantBankIdentifier,
				initiationReport.balance,
				initiationReport.settlementTransfer,
				initiationReport.currency,
			]);
		});

		// Create a new workbook
		const wb = XLSX.utils.book_new();

		// Add a worksheet to the workbook
		const ws = XLSX.utils.aoa_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");

		// Save the workbook as an Excel file
		XLSX.writeFile(wb, `initiation-report-${this.chosenSettlementId}.xlsx`);
	}
}
