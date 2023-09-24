import {Component, OnDestroy, OnInit} from "@angular/core";
import {BulkQuotesService} from "src/app/_services_and_types/bulk-quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {BulkQuote} from '../_services_and_types/bulk_quote_types';
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: 'app-bulk-quotes',
	templateUrl: './bulk-quotes.component.html'
})
export class BulkQuotesComponent implements OnInit, OnDestroy {
	bulkQuotes: BehaviorSubject<BulkQuote[]> = new BehaviorSubject<BulkQuote[]>([]);
	bulkQuotesSubs?: Subscription;

	constructor(private _bulkQuotesSvc: BulkQuotesService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("QuotesComponent ngOnInit");

		this.bulkQuotesSubs = this._bulkQuotesSvc.getAllQuotes().subscribe((list) => {
			console.log("QuotesComponent ngOnInit - got getAllQuotes");

			this.bulkQuotes.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});


	}

	ngOnDestroy() {
		if (this.bulkQuotesSubs) {
			this.bulkQuotesSubs.unsubscribe();
		}

	}
}
