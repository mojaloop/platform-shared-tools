import { Component, OnDestroy, OnInit } from "@angular/core";
import { TransfersService } from "src/app/_services_and_types/transfers.service";
import { ParticipantsService } from "src/app/_services_and_types/participants.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { TransfersSearchResults } from "src/app/_services_and_types/transfer_types";
import { MessageService } from "src/app/_services_and_types/message.service";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import { FormBuilder, FormGroup } from '@angular/forms';
import { HUB_PARTICIPANT_ID, IParticipant } from "@mojaloop/participant-bc-public-types-lib";

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html',
	styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit, OnDestroy {

	readonly ALL_STR_ID = "(All)";
	public criteriaFromDate = "";

	transfers: BehaviorSubject<TransfersSearchResults> = new BehaviorSubject<TransfersSearchResults>({
		pageSize: 10,
		totalPages: 1,
		pageIndex: 0,
		items: []
	});
	transfersSubs?: Subscription;
	participantsSubs?: Subscription;
	filterForm: FormGroup;
	pageIndex: number = 0;
	pageSize: number = 10;
	userPageIndex: number = 1; //for UI control to show current page number

	//Filters
	keywordState: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordCurrency: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordSourceAppName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	//Filters
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	partyNameList = [this.ALL_STR_ID, "VisionFund_Myanmar", "OkDollar", "Company_A_Limited"];
	partyIdTypeList = [this.ALL_STR_ID, "MSISDN", "PERSONAL_ID", "BUSINESS", "DEVICE", "ACCOUNT_ID", "IBAN", "ALIAS"];
	transferTypeList = [this.ALL_STR_ID, "DEPOSIT", "WITHDRAWAL", "REFUND", "TRANSFER"];

	isFilterShow: boolean = true;
	initialFilterValues = {
		filterPayerDfspName: this.ALL_STR_ID,
		filterPayeeDfspName: this.ALL_STR_ID,
		filterTransferState: this.ALL_STR_ID,
		filterTransferType: this.ALL_STR_ID,
		filterPayerIdType: this.ALL_STR_ID,
		filterPayeeIdType: this.ALL_STR_ID,
		filterCurrency: this.ALL_STR_ID,
		filterPayerValue: null,
		filterPayeeIdValue: null,
		filterTransferId: null,
		filterStartDate: null,
		filterEndDate: null,
		filterId: null,
		//add initial values for other form controls (filters)
	}

	constructor(private _participantsSvc: ParticipantsService, private formBuilder: FormBuilder, private _transfersSvc: TransfersService, private _messageService: MessageService,) {
		this.filterForm = this.formBuilder.group(this.initialFilterValues);
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8);
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8); // remove Z, ms and secs
	}

	ngOnInit(): void {
		console.log("TransfersComponent ngOnInit");

		this.getSearchKeywords();

		this.participantsSubs = this._participantsSvc
			.getAllParticipants()
			.subscribe(
				(result) => {

					// remove the hub from the list
					const onlyDfsps = result.items.filter(value => value.id !== HUB_PARTICIPANT_ID);

					this.participants.next(onlyDfsps);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	filterToggle() {
		this.isFilterShow = !this.isFilterShow
	}

	clearFilters() {
		this.filterForm.reset(this.initialFilterValues);
	}

	//paginations
	onPrevious() {
		if (this.userPageIndex >= 1) {
			this.pageIndex--;
			this.userPageIndex--;
			this.search()
		}
	}

	onNext() {
		if (this.transfers.value.totalPages && this.pageIndex < this.transfers.value.totalPages) {
			this.pageIndex++;
			this.userPageIndex++;
			this.search();
		}
	}

	toFirstPage() {
		this.pageIndex = 0
		this.userPageIndex = 1;
		this.search()
	}

	toLastPage() {
		if (this.transfers.value.totalPages) {
			this.pageIndex = this.transfers.value.totalPages - 1;
			this.userPageIndex = this.transfers.value.totalPages;
			this.search();
		}
	}

	onPageSizeChange() {
		this.search();
	}

	onPageIndexChange() {
		this.pageIndex = this.userPageIndex - 1
		this.search();
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
		const transferState = filterTransferState === this.ALL_STR_ID ? undefined : filterTransferState;
		const currency = filterCurrency === this.ALL_STR_ID ? undefined : filterCurrency;
		const bulkTransferId = filterTransferId || undefined;
		const payerIdType = filterPayerIdType === this.ALL_STR_ID ? undefined : filterPayerIdType;
		const payeeIdType = filterPayeeIdType === this.ALL_STR_ID ? undefined : filterPayeeIdType;
		const payerDfspName = filterPayerDfspName === this.ALL_STR_ID ? undefined : filterPayerDfspName;
		const payeeDfspName = filterPayeeDfspName === this.ALL_STR_ID ? undefined : filterPayeeDfspName;
		const transferType = filterTransferType === this.ALL_STR_ID ? undefined : filterTransferType;
		const payerIdValue = filterPayerValue || undefined;
		const payeeIdValue = filterPayeeIdValue || undefined;
		

		this.transfersSubs = this._transfersSvc.search(
			transferState,
			currency,
			startDate,
			endDate,
			bulkTransferId,
			payerIdType,
			payeeIdType,
			payerDfspName,
			payeeDfspName,
			payerIdValue,
			payeeIdValue,
			transferType,
			undefined, // TODO: add bulk filter box
			this.pageSize,
			this.pageIndex,
		).subscribe((result) => {
			console.log("TransfersComponent search - got TransfersSearchResults");

			const newTransferSearchResult: TransfersSearchResults = {
				pageSize: this.pageSize,
				totalPages: result.totalPages,
				pageIndex: this.pageIndex,
				items: result.items,
			};

			this.transfers.next(newTransferSearchResult);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

	}

	async getSearchKeywords() {
		this.keywordsSubs = this._transfersSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("TransfersComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "state") this.keywordState.next(value.distinctTerms);
				if (value.fieldName == "currency") this.keywordCurrency.next(value.distinctTerms);
				if (value.fieldName == "id") this.keywordSourceAppName.next(value.distinctTerms);
			});
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
