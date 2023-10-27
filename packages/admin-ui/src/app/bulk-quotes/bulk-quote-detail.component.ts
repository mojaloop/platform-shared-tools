import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {NgbModal, NgbNav} from "@ng-bootstrap/ng-bootstrap";
import {BulkQuote} from '../_services_and_types/bulk_quote_types';
import {BulkQuotesService} from '../_services_and_types/bulk-quotes.service';


@Component({
	selector: 'app-bulk-quote-detail',
	templateUrl: './bulk-quote-detail.component.html'
})
export class BulkQuoteDetailComponent implements OnInit {
	private _bulkQuoteId: string | null = null;
	public bulkQuote: BehaviorSubject<BulkQuote | null> = new BehaviorSubject<BulkQuote | null>(null);
	public allQuotes: BehaviorSubject<Quote[] | null> = new BehaviorSubject<Quote[] | null>(null);
	public quotesNotProcessed: BehaviorSubject<Quote[] | null> = new BehaviorSubject<Quote[] | null>(null);

	@ViewChild("nav") // Get a reference to the ngbNav
	navBar!: NgbNav;

	constructor(private _route: ActivatedRoute, private _bulkQuotesSvc: BulkQuotesService, private _quotesSvc: QuotesService, private _messageService: MessageService, private _modalService: NgbModal) {

	}

	async ngOnInit(): Promise<void> {
		console.log(this._route.snapshot.routeConfig?.path);
		if (this._route.snapshot.routeConfig?.path === this._bulkQuotesSvc.hubId) {
			this._bulkQuoteId = this._bulkQuotesSvc.hubId;
		} else {
			this._bulkQuoteId = this._route.snapshot.paramMap.get('id');
		}

		if (!this._bulkQuoteId) {
			throw new Error("invalid bulkQuote id");
		}

		await this._fetchQuote(this._bulkQuoteId);

		await this._fetchAllQuotes(this._bulkQuoteId);
	}

	private async _fetchQuote(id: string): Promise<void> {
		return new Promise(resolve => {
			this._bulkQuotesSvc.getBulkQuote(id).subscribe(bulkQuote => {
				this.bulkQuote.next(bulkQuote);
				resolve();
			});
		});
	}

	private async _fetchAllQuotes(bulkQuoteId: string): Promise<void> {
		return new Promise(resolve => {
			this._quotesSvc.search(
				undefined,
				undefined,
				undefined,
				undefined,
				bulkQuoteId
			).subscribe(quotesSearchResult => {
				this.allQuotes.next(quotesSearchResult.items);
				resolve();
			});
		});
	}

	tabChange(e: any) {
		console.log(`Tab changed to ${e.nextId}`);
	}

	async copyQuoteIdToClipboard() {
		await navigator.clipboard.writeText(this.bulkQuote.value!.bulkQuoteId || "");
	}
}
