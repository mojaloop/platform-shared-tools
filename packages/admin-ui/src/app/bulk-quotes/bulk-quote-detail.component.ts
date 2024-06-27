import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {NgbModal, NgbNav} from "@ng-bootstrap/ng-bootstrap";
import {BulkQuote} from '../_services_and_types/bulk_quote_types';
import {BulkQuotesService} from '../_services_and_types/bulk-quotes.service';
import { PaginateResult } from "../_utils";


@Component({
	selector: 'app-bulk-quote-detail',
	templateUrl: './bulk-quote-detail.component.html'
})
export class BulkQuoteDetailComponent implements OnInit {
	private _bulkQuoteId: string | null = null;
	public bulkQuote: BehaviorSubject<BulkQuote | null> = new BehaviorSubject<BulkQuote | null>(null);
	public allQuotes: BehaviorSubject<Quote[] | null> = new BehaviorSubject<Quote[] | null>(null);
	public quotesNotProcessed: BehaviorSubject<Quote[] | null> = new BehaviorSubject<Quote[] | null>(null);

	private _live: boolean = false;
	private _reloadRequested: boolean = false;

	private _reloadCount = 0;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);


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

		console.log(this._route.snapshot.routeConfig?.path);

		this._live = this._route.snapshot.queryParamMap.has('live');

		this._route.params.subscribe(params => {
			this._bulkQuoteId = params['id'];

			if (this._bulkQuoteId) {
				this._fetchQuote(this._bulkQuoteId);
			} else {
				throw new Error("invalid parameter");
			}
		});
	}

	private async _fetchQuote(id: string): Promise<void> {
		this._bulkQuotesSvc.getBulkQuote(id).subscribe(bulkQuote => {
			this.bulkQuote.next(bulkQuote);

			if (this._live && !bulkQuote || !(bulkQuote?.status === "REJECTED" || bulkQuote?.status === "ACCEPTED")) {

				if (this._reloadCount > 30) return;

				this._reloadCount++;
				this._reloadRequested = true;
				setTimeout(() => {
					this._reloadCount++;
					this._fetchQuote(id);
				}, 1000);

			} else if (this._live && this._reloadRequested) {
				this._messageService.addSuccess("Quote reloaded");
			}
		});
	}

	private async _fetchAllQuotes(bulkQuoteId: string): Promise<void> {
		return new Promise(resolve => {
			this._quotesSvc.search(
				undefined,
				undefined,
				undefined,
				undefined,
				bulkQuoteId,
				undefined,
				undefined,
				undefined,
				undefined,
				100
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

	search(pageIndex: number = 0):Promise<void> {

		return new Promise(resolve => {
			this._quotesSvc.search(
				undefined,
				undefined,
				undefined,
				undefined,
				this._bulkQuoteId!,
				undefined,
				undefined,
				undefined,
				undefined,
				pageIndex
			).subscribe(quotesSearchResult => {
				this.allQuotes.next(quotesSearchResult.items);
				resolve();
			});
		});

	}
}
