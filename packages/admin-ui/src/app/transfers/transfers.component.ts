import { Component, OnDestroy, OnInit } from "@angular/core";
import { TransfersService } from "src/app/_services_and_types/transfers.service";
import { ParticipantsService } from "src/app/_services_and_types/participants.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { Transfer, TransferSearchResult } from "src/app/_services_and_types/transfer_types";
import { MessageService } from "src/app/_services_and_types/message.service";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import { FormBuilder, FormGroup } from '@angular/forms';
import { IParticipant } from "@mojaloop/participant-bc-public-types-lib";

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html',
	styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<TransferSearchResult> = new BehaviorSubject<TransferSearchResult>({
		pageSize: 5,
		totalPages: 1,
		pageIndex: 1,
		items: [],
	  });	  
	transfersSubs?: Subscription;
	participantsSubs?: Subscription;
	filterForm: FormGroup;
	pageIndex:number = 1;
	pageSize:number = 5;

	//Filters
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	partyNameList = ["ALL", "VisionFund_Myanmar", "OkDollar", "Company_A_Limited"];
	partyIdTypeList = ["ALL", "MSISDN", "PERSONAL_ID", "BUSINESS", "DEVICE", "ACCOUNT_ID", "IBAN", "ALIAS"];
	transferStateList = ["ALL", "Received", "Reserved", "Rejected", "Committed", "Expired"]
	currencyCodeList = ["ALL", "EUR", "USD"];
	transferTypeList = ["ALL", "DEPOSIT", "WITHDRAWAL", "REFUND"];

	isFilterShow: boolean = false;
	initialValues = {
		filterPayerDfspName: 'ALL',
		filterPayeeDfspName: 'ALL',
		filterTransferState: 'ALL',
		filterTransferType: 'ALL',
		filterPayerIdType: 'ALL',
		filterPayeeIdType: 'ALL',
		filterCurrency: 'ALL',
		filterPayerValue: null,
		filterPayeeIdValue: null,
		filterTransferId: null,
		filterStartDate: null,
		filterEndDate: null,
		filterId: null,
		//add initial values for other form controls (filters)
	}

	constructor(private _participantsSvc: ParticipantsService, private formBuilder: FormBuilder, private _transfersSvc: TransfersService, private _messageService: MessageService,) {
		this.filterForm = this.formBuilder.group(this.initialValues);
	}

	ngOnInit(): void {
		console.log("TransfersComponent ngOnInit");

		this.participantsSubs = this._participantsSvc
			.getAllParticipants()
			.subscribe(
				(list) => {

					// remove the hub from the list
					const newList: IParticipant[] = list.filter(
						(value) => value.id !== this._participantsSvc.hubId
					);

					this.participants.next(newList);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);

		this.clearFilters();
	}

	clearFilters() {
		this.filterForm.reset(this.initialValues);
	}

	filterToggle() {
		this.isFilterShow = !this.isFilterShow
	}

	onPrevious() {
		this.pageIndex --;
		this.search()
	}

	onNext() {
		if (this.transfers.value.totalPages && this.pageIndex < this.transfers.value.totalPages) {
			this.pageIndex++;
			this.search();
		  }
	}

	toFirstPage(){
		this.pageIndex = 1
		this.search()
	}

	toLastPage(){
		if (this.transfers.value.totalPages) {
			this.pageIndex = this.transfers.value.totalPages;
			this.search();
		  }
	}

	search() {
		const {
			filterTransferState,
			filterCurrency,
			filterStartDate,
			filterEndDate,
			filterTransferId,
			filterPayerIdType,
			filterPayeeIdType,
			filterPayeeDfspName,
			filterPayerDfspName,
			filterTransferType,
			filterPayerValue,
			filterPayeeIdValue
		} = this.filterForm.value;

		const startDate = filterStartDate ? new Date(filterStartDate).valueOf() : undefined;
		const endDate = filterEndDate ? new Date(filterEndDate).valueOf() : undefined;
		const transferState = filterTransferState.toUpperCase() === "ALL" ? undefined : filterTransferState;
		const currency = filterCurrency.toUpperCase() === "ALL" ? undefined : filterCurrency;
		const transferId = filterTransferId || undefined;
		const payerIdType = filterPayerIdType.toUpperCase() === "ALL" ? undefined : filterPayerIdType;
		const payeeIdType = filterPayeeIdType.toUpperCase() === "ALL" ? undefined : filterPayeeIdType;
		const payerDfspName = filterPayerDfspName.toUpperCase() === "ALL" ? undefined : filterPayerDfspName;
		const payeeDfspName = filterPayeeDfspName.toUpperCase() === "ALL" ? undefined : filterPayeeDfspName;
		const payerIdValue = filterPayerValue || undefined;
		const payeeIdValue = filterPayeeIdValue || undefined;
		const transferType = filterTransferType.toUpperCase() === "ALL" ? undefined : filterTransferType;

		this.transfersSubs = this._transfersSvc.searchTransfers(
			transferState,
			currency,
			startDate,
			endDate,
			transferId,
			payerIdType,
			payeeIdType,
			payerDfspName,
			payeeDfspName,
			payerIdValue,
			payeeIdValue,
			transferType,
			this.pageSize,
			this.pageIndex
		).subscribe((list) => {
			const newTransferSearchResult: TransferSearchResult = {
				pageSize: list.pageSize,
				totalPages: list.totalPages,
				pageIndex: list.pageIndex,
				items: list.items,
			  };
			  this.transfers.next(newTransferSearchResult);
		}, (error) => {
			if (error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	onPageSizeChange() {
		this.search();
	}

	ngOnDestroy() {
		if (this.transfersSubs) {
			this.transfersSubs.unsubscribe();
		}

	}
}
