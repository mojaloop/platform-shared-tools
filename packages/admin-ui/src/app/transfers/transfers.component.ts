import { Component, OnDestroy, OnInit } from "@angular/core";
import { TransfersService } from "src/app/_services_and_types/transfers.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { Transfer } from "src/app/_services_and_types/transfer_types";
import { MessageService } from "src/app/_services_and_types/message.service";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html',
	styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<Transfer[]> = new BehaviorSubject<Transfer[]>([]);
	transfersSubs?: Subscription;
	filterForm: FormGroup;

	partyNameList = ["ALL", "VisionFund_Myanmar", "OkDollar", "Company_A_Limited"];
	partyIdTypeList = ["ALL", "MSISDN", "PERSONAL_ID", "BUSINESS", "DEVICE", "ACCOUNT_ID", "IBAN", "ALIAS"];
	transferStateList = ["ALL", "Received", "Reserved", "Rejected", "Committed", "Expired"]
	currencyCodeList = ["ALL", "EUR", "USD"];
	transferTypeList = ["ALL", "DEPOSIT", "WITHDRAWAL", "REFUND"];

	isFilterShow: boolean = false;
	transferDetail: Transfer | null = null;
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

	constructor(private formBuilder: FormBuilder, private _transfersSvc: TransfersService, private _messageService: MessageService,) {
		this.filterForm = this.formBuilder.group(this.initialValues);

	}

	ngOnInit(): void {
		console.log("TransfersComponent ngOnInit");

		this.clearFilters();
	}

	clearFilters() {
		this.filterForm.reset(this.initialValues);
	}

	filterToggle() {
		this.isFilterShow = !this.isFilterShow
	}

	search() {
		const { filterTransferState, filterCurrency, filterStartDate, filterEndDate, filterTransferId, filterPayerIdType, filterPayeeIdType, filterPayeeDfspName, filterPayerDfspName, filterTransferType, filterPayerValue, filterPayeeIdValue } = this.filterForm.value
		console.log('formValue', this.filterForm.value);

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
			transferState, currency, startDate,
			endDate, transferId, payerIdType, payeeIdType,
			payerDfspName, payeeDfspName, payerIdValue,
			payeeIdValue, transferType
		).subscribe((list) => {
			console.log("TransfersComponent search - got searchTransfers");

			this.transfers.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.transfersSubs) {
			this.transfersSubs.unsubscribe();
		}

	}
}
