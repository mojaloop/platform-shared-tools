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
	quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	quotesSubs?: Subscription;

	readonly ALL_STR_ID = "(All)";
	entries: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	entriesSubs?: Subscription;

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

	async ngOnInit(): Promise<void> {
		console.log("QuotesComponent ngOnInit");

		await this.getSearchKeywords();

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	search(pageIndex: number = 0) {

		const filterQuoteAmountType = (document.getElementById("filterQuoteAmountType") as HTMLSelectElement).value || null;
		const filterQuoteTransactionType = (document.getElementById("filterQuoteTransactionType") as HTMLSelectElement).value || null;
		const filterQuoteId = (document.getElementById("filterQuoteId") as HTMLSelectElement).value || null;
		const filterTransactionId = (document.getElementById("filterTransactionId") as HTMLSelectElement).value || null;

		this.entriesSubs = this._quotesSvc.search(
			null,
			(filterQuoteAmountType === this.ALL_STR_ID ? null : filterQuoteAmountType),
			(filterQuoteTransactionType === this.ALL_STR_ID ? null : filterQuoteTransactionType),
			(filterQuoteId === this.ALL_STR_ID ? null : filterQuoteId),
			(filterTransactionId === this.ALL_STR_ID ? null : filterTransactionId),
			undefined,
			pageIndex
		).subscribe((result) => {
			console.log("QuotesComponent search - got QuotesSearchResults");

			this.entries.next(result.items);

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
