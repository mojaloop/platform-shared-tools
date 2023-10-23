import {Component, OnDestroy, OnInit} from "@angular/core";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Quote} from "src/app/_services_and_types/quote_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: "app-quotes",
	templateUrl: "./quotes.component.html",
})
export class QuotesComponent implements OnInit, OnDestroy {
	quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	quotesSubs?: Subscription;

	constructor(
		private _quotesSvc: QuotesService,
		private _messageService: MessageService
	) {
	}

	ngOnInit(): void {
		console.log("QuotesComponent ngOnInit");

		this.quotesSubs = this._quotesSvc.getAllQuotes().subscribe(
			(list) => {
				console.log("QuotesComponent ngOnInit - got getAllQuotes");

				this.quotes.next(list);
			},
			(error) => {
				if (error && error instanceof UnauthorizedError) {
					this._messageService.addError(error.message);
				}
			}
		);
	}

	search() {
		const elemFilterQuoteAmountType = (
			document.getElementById("filterQuoteAmountType") as HTMLSelectElement
		).value;
		const elemFilterQuoteTransactionType = (
			document.getElementById("filterQuoteTransactionType") as HTMLSelectElement
		).value;
		const quoteId =
			(document.getElementById("filterQuoteId") as HTMLInputElement).value ||
			undefined;
		const transactionId =
			(document.getElementById("filterTransactionId") as HTMLInputElement)
				.value || undefined;

		const amountType =
			elemFilterQuoteAmountType.toUpperCase() === "ALL"
				? undefined
				: elemFilterQuoteAmountType;
		const transactionType =
			elemFilterQuoteTransactionType.toUpperCase() === "ALL"
				? undefined
				: elemFilterQuoteTransactionType;

		this.quotesSubs = this._quotesSvc
			.searchQuotes(quoteId, transactionId, amountType, transactionType)
			.subscribe(
				(list) => {
					console.log("QuotesComponent search - got searchTransfers");

					this.quotes.next(list);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	ngOnDestroy() {
		if (this.quotesSubs) {
			this.quotesSubs.unsubscribe();
		}
	}
}
