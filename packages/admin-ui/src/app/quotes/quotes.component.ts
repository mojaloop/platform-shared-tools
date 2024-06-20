import {Component, OnDestroy, OnInit} from "@angular/core";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Quote} from "src/app/_services_and_types/quote_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {paginate, PaginateResult} from "../_utils";
import {HUB_PARTICIPANT_ID, IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";

@Component({
	selector: "app-quotes",
	templateUrl: "./quotes.component.html",
})
export class QuotesComponent implements OnInit, OnDestroy {

	readonly ALL_STR_ID = "(All)";
	quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	quotesSubs?: Subscription;

	keywordQuoteAmountType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordQuoteTransactionType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordQuoteId: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordTransactionId: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordStatus: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	constructor(
		private _participantsSvc: ParticipantsService,
		private _quotesSvc: QuotesService,
		private _messageService: MessageService
	) {
	}

	ngOnInit(): void {
		console.log("QuotesComponent ngOnInit");

		this.getSearchKeywords();

		// Get participants for filters
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

	search(pageIndex?: number, pageSize?: number) {
		// For pagination
		if (pageIndex == null) {
			const pageIndexElem = document.getElementById("pageIndex") as HTMLSelectElement;
			pageIndex = parseInt(pageIndexElem?.value ?? 0);
		}
		if (pageSize == null) {
			const pageSizeElem = document.getElementById("pageSize") as HTMLSelectElement;
			pageSize = parseInt(pageSizeElem?.value ?? 10);
		}

		const filterQuoteAmountType = (document.getElementById("filterQuoteAmountType") as HTMLSelectElement).value || undefined;
		const filterQuoteTransactionType = (document.getElementById("filterQuoteTransactionType") as HTMLSelectElement).value || undefined;
		const filterQuoteId = (document.getElementById("filterQuoteId") as HTMLSelectElement).value || undefined;
		const filterTransactionId = (document.getElementById("filterTransactionId") as HTMLSelectElement).value || undefined;
		const filterBulkQuoteId = (document.getElementById("filterBulkQuoteId") as HTMLSelectElement).value || undefined;
		const filterPayerId = (document.getElementById("filterPayerId") as HTMLSelectElement).value || undefined;
		const filterPayeeId = (document.getElementById("filterPayeeId") as HTMLSelectElement).value || undefined;
		const filterStatus = (document.getElementById("filterStatus") as HTMLSelectElement).value || undefined;

		this.quotesSubs = this._quotesSvc.search(
			(filterQuoteAmountType === this.ALL_STR_ID ? undefined : filterQuoteAmountType),
			(filterQuoteTransactionType === this.ALL_STR_ID ? undefined : filterQuoteTransactionType),
			(filterQuoteId === this.ALL_STR_ID ? undefined : filterQuoteId),
			(filterTransactionId === this.ALL_STR_ID ? undefined : filterTransactionId),
			(filterBulkQuoteId === this.ALL_STR_ID ? undefined : filterBulkQuoteId),
			(filterPayerId === this.ALL_STR_ID ? undefined : filterPayerId),
			(filterPayeeId === this.ALL_STR_ID ? undefined : filterPayeeId),
			(filterStatus === this.ALL_STR_ID ? undefined : filterStatus),
			pageIndex,
			pageSize,
		).subscribe((result) => {
			console.log("QuotesComponent search - got QuotesSearchResults");

			this.quotes.next(result.items);

			const pageRes = paginate(result.pageIndex, result.totalPages);
			if (pageRes) pageRes.pageSize = pageSize;
			this.paginateResult.next(pageRes);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

	}



	async getSearchKeywords() {
		this.keywordsSubs = this._quotesSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("QuotesComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "amountType") this.keywordQuoteAmountType.next(value.distinctTerms);
				if (value.fieldName == "transactionType") this.keywordQuoteTransactionType.next(value.distinctTerms);
				if (value.fieldName == "quoteId") this.keywordQuoteId.next(value.distinctTerms);
				if (value.fieldName == "transactionId") this.keywordTransactionId.next(value.distinctTerms);
				if (value.fieldName == "status") this.keywordStatus.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.quotesSubs) {
			this.quotesSubs.unsubscribe();
		}
	}
}
