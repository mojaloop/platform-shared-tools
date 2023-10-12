import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MessageService } from "../_services_and_types/message.service";

interface DetailsReport {
	senderDfspId: string
	senderDfspName: string
	receiverDfspId: string
	receiverDfspName: string
	transferId: string
	txType: string
	transactionDate: string
	senderIdType: string
	senderId: string
	receiverIdType: string
	receiverId: string
	receivedAmount: number
	sentAmount: number
	fee?: number
}

@Component({
	selector: "app-dfsp-settlement-details-report",
	templateUrl: "./dfsp-settlement-details-report.component.html",
})
export class DFSPSettlementDetailsReport implements OnInit {
	public dfspFilterForm!: FormGroup;
	public settlementIdForm!: FormGroup;
	showSettlementIdForm: boolean = false;
	showResults: boolean = false;
	reports: DetailsReport[] = [
		{
			senderDfspId: "thitsawallet1",
			senderDfspName: "Thitsa Wallet",
			receiverDfspId: "visionfund/ 010",
			receiverDfspName: "Vision Fund Myanmar MFI",
			transferId: "a2f13f10-a41a-437a-95a7-68d3e25e5561",
			txType: "TRANSFER",
			transactionDate: "01-Mar-2023 10:21:01 AM",
			senderIdType: "MSISDN",
			senderId: "091234567",
			receiverIdType: "ACCOUNT_ID",
			receiverId: "10512",
			receivedAmount: 1000,
			sentAmount: 0,
		},
		{
			senderDfspId: "visionfund/ 010",
			senderDfspName: "Vision Fund Myanmar MFI",
			receiverDfspId: "020",
			receiverDfspName: "ABC Wallet",
			transferId: "593fbce9-9862-4fb3-8b58-f18e321960fd",
			txType: "TRANSFER",
			transactionDate: "01-Mar-2023 10:25:08 AM",
			senderIdType: "ACCOUNT_ID",
			senderId: "10545632",
			receiverIdType: "MSISDN",
			receiverId: "09798465123",
			receivedAmount: 0,
			sentAmount: 5000,
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
