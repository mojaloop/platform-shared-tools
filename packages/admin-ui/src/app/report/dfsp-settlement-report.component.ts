import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MessageService } from "../_services_and_types/message.service";

interface Report {
	dfspId: string
	dfspName: string
	sentVolume: number
	sentValue: number
	receivedVolume: number
	receivedValue: number
	totalTransactionVolume: number
	totalValue: number
	netPoition: string
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
	reports: Report[] = [
		{
			dfspId: 'cnp/ 007',
			dfspName: 'CNP',
			sentVolume: 2,
			sentValue: 2000,
			receivedVolume: 1,
			receivedValue: 1500,
			totalTransactionVolume: 3,
			totalValue: 3500,
			netPoition: "(500)",
		},
		{
			dfspId: 'demomfi/ 006',
			dfspName: 'DEMO MFI',
			sentVolume: 0,
			sentValue: 0,
			receivedVolume: 1,
			receivedValue: 1000,
			totalTransactionVolume: 3,
			totalValue: 1000,
			netPoition: "1000",
		},
	]

	constructor(private _messageService: MessageService) {}

	async ngOnInit(): Promise<void> {
		this._initForms();
	}

	private _initForms() {
		this.dfspFilterForm = new FormGroup({
			dfspName: new FormControl("", [Validators.required]),
			startDate: new FormControl("", []),
			endDate: new FormControl("", []),
		});

		this.settlementIdForm = new FormGroup({
			settlementId: new FormControl("", [Validators.required]),
		});
	}

	searchSettlementId() {
		if (!this.dfspFilterForm.valid) {
			this._messageService.addError("Fill all the required fields!");
			return;
		}

		const dfspName = this.dfspFilterForm.controls.dfspName.value;
		const startDate = this.dfspFilterForm.controls.startDate.value;
		const endDate = this.dfspFilterForm.controls.endDate.value;
		this.showSettlementIdForm = true;
		console.log(dfspName, startDate, endDate);
	}

	searchReports() {
		if (!this.settlementIdForm.valid) {
			this._messageService.addError("Settlement ID is required!");
			return;
		}

		const settlementId = this.settlementIdForm.controls.settlementId.value;
		this.showResults = true;
		console.log(settlementId);
	}
}
