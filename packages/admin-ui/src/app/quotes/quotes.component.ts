import {Component, OnDestroy, OnInit} from "@angular/core";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Quote} from "src/app/_services_and_types/quote_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {paginate, PaginateResult} from "../_utils";

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
	keywordsSubs?: Subscription;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	constructor(
		private _quotesSvc: QuotesService,
		private _messageService: MessageService
	) {
	}

	ngOnInit(): void {
		console.log("QuotesComponent ngOnInit");

		this.getSearchKeywords();

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	search(pageIndex: number = 0) {

		const filterQuoteAmountType = (document.getElementById("filterQuoteAmountType") as HTMLSelectElement).value || undefined;
		const filterQuoteTransactionType = (document.getElementById("filterQuoteTransactionType") as HTMLSelectElement).value || undefined;
		const filterQuoteId = (document.getElementById("filterQuoteId") as HTMLSelectElement).value || undefined;
		const filterTransactionId = (document.getElementById("filterTransactionId") as HTMLSelectElement).value || undefined;
		const filterBulkQuoteId = (document.getElementById("filterBulkQuoteId") as HTMLSelectElement).value || undefined;

		this.quotesSubs = this._quotesSvc.search(
			(filterQuoteAmountType === this.ALL_STR_ID ? undefined : filterQuoteAmountType),
			(filterQuoteTransactionType === this.ALL_STR_ID ? undefined : filterQuoteTransactionType),
			(filterQuoteId === this.ALL_STR_ID ? undefined : filterQuoteId),
			(filterTransactionId === this.ALL_STR_ID ? undefined : filterTransactionId),
			(filterBulkQuoteId === this.ALL_STR_ID ? undefined : filterBulkQuoteId),
			undefined,
			pageIndex
		).subscribe((result) => {
			console.log("QuotesComponent search - got QuotesSearchResults");

			this.quotes.next(result.items);

			const pageRes = paginate(result.pageIndex, result.totalPages);
			console.log(pageRes);
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
