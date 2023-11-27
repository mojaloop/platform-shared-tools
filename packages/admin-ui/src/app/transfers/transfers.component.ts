import {Component, OnDestroy, OnInit} from "@angular/core";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Transfer, TransfersSearchResults} from "src/app/_services_and_types/transfer_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {FormBuilder, FormGroup} from '@angular/forms';
import {HUB_PARTICIPANT_ID, IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {paginate, PaginateResult} from "../_utils";

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html'
})
export class TransfersComponent implements OnInit, OnDestroy {

	readonly ALL_STR_ID = "(All)";
	public criteriaFromDate = "";

	transfers: BehaviorSubject<Transfer[]> = new BehaviorSubject<Transfer[]>([]);
	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	transfersSubs?: Subscription;
	participantsSubs?: Subscription;
	filterForm: FormGroup;

	//Filters
	keywordState: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordCurrency: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordSourceAppName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordTransferType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordPayerIdType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordPayeeIdType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	//Filters
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	
	isFilterShow: boolean = true;
	initialFilterValues = {
		filterTransferState: this.ALL_STR_ID,
		filterTransferType: this.ALL_STR_ID,
		filterPayerIdType: this.ALL_STR_ID,
		filterPayeeIdType: this.ALL_STR_ID,
		filterCurrency: this.ALL_STR_ID,
		filterPayerId: this.ALL_STR_ID,
		filterPayeeId: this.ALL_STR_ID,
		filterTransferId: null,
		filterBulkTransferId: null,
		filterStartDate: null,
		filterEndDate: null,
		filterId: null,
		//add initial values for other form controls (filters)
	};

	constructor(private _participantsSvc: ParticipantsService, private formBuilder: FormBuilder, private _transfersSvc: TransfersService, private _messageService: MessageService,) {
		this.filterForm = this.formBuilder.group(this.initialFilterValues);
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8);
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8); // remove Z, ms and secs


	}

	async ngOnInit(): Promise<void> {
		console.log("TransfersComponent ngOnInit");

		await this.getSearchKeywords();

		this.participantsSubs = this._participantsSvc
			.getAllParticipants()
			.subscribe(
				(result) => {
					// remove the hub from the list
					const onlyDfsps = result.items.filter(value => value.id !== HUB_PARTICIPANT_ID);
					this.participants.next(onlyDfsps);

					this.search();
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}

					this.search();
				}
			);
	}

	filterToggle() {
		this.isFilterShow = !this.isFilterShow;
	}

	clearFilters() {
		this.filterForm.reset(this.initialFilterValues);
	}


	search(pageIndex?: number, pageSize?:number) {
		if(pageSize == undefined) {
			const pageSizeElem = document.getElementById("pageSize") as HTMLSelectElement;
			pageSize = parseInt(pageSizeElem?.value ?? 10);
		}
		if(pageIndex == undefined) {
			const pageIndexElem = document.getElementById("pageIndex") as HTMLSelectElement;
			pageIndex = parseInt(pageIndexElem?.value ?? 0);
		}

		const {
			filterTransferState,
			filterCurrency,
			filterStartDate,
			filterEndDate,
			filterTransferId,
			filterPayerIdType,
			filterPayeeIdType,
			filterTransferType,
			filterPayerId,
			filterPayeeId,
			filterBulkTransferId
		} = this.filterForm.value;

		debugger
		const startDate = filterStartDate ? new Date(filterStartDate).valueOf() : undefined;
		const endDate = filterEndDate ? new Date(filterEndDate).valueOf() : undefined;
		const transferState = filterTransferState === this.ALL_STR_ID ? undefined : filterTransferState;
		const currency = filterCurrency === this.ALL_STR_ID ? undefined : filterCurrency;
		const transferId = filterTransferId || undefined;
		const payerIdType = filterPayerIdType === this.ALL_STR_ID ? undefined : filterPayerIdType;
		const payeeIdType = filterPayeeIdType === this.ALL_STR_ID ? undefined : filterPayeeIdType;
		const transferType = filterTransferType === this.ALL_STR_ID ? undefined : filterTransferType;
		const payerId = filterPayerId === this.ALL_STR_ID ? undefined : filterPayerId; 
		const payeeId = filterPayeeId === this.ALL_STR_ID ? undefined : filterPayeeId; 
		const bulkTransferId = filterBulkTransferId || undefined;

		this.transfersSubs = this._transfersSvc.search(
			transferState,
			currency,
			startDate,
			endDate,
			transferId,
			payerIdType,
			payeeIdType,
			payerId,
			payeeId,
			transferType,
			bulkTransferId, // TODO: add bulk filter box
			pageIndex,
			pageSize,
		).subscribe((result) => {
			console.log("TransfersComponent search - got TransfersSearchResults");

			this.transfers.next(result.items);

			const paginateResult = paginate(result.pageIndex, result.totalPages);
			if(paginateResult) paginateResult.pageSize = pageSize;

			this.paginateResult.next(paginateResult);
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
				if (value.fieldName == "transferType") this.keywordTransferType.next(value.distinctTerms);
				if (value.fieldName == "payerIdType") this.keywordPayerIdType.next(value.distinctTerms);
				if (value.fieldName == "payeeIdType") this.keywordPayeeIdType.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
		if (this.transfersSubs) {
			this.transfersSubs.unsubscribe();
		}

	}
}