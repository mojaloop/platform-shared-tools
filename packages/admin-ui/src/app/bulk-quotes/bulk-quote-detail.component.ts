import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import * as uuid from "uuid";
import {
  Quote,
  QuoteAccount, QuoteFundsMovement,
  QuoteFundsMovementDirection
} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {installTempPackage} from "@angular/cli/utilities/install-package";
import {ModalDismissReasons, NgbModal, NgbModalRef, NgbNav} from "@ng-bootstrap/ng-bootstrap";
import { BulkQuote } from '../_services_and_types/bulk_quote_types';
import { BulkQuotesService } from '../_services_and_types/bulk-quotes.service';


@Component({
  selector: 'app-bulk-quote-detail',
  templateUrl: './bulk-quote-detail.component.html'
})
export class BulkQuoteDetailComponent implements OnInit {
  private _bulkQuoteId: string | null = null;
  public bulkQuote: BehaviorSubject<BulkQuote | null> = new BehaviorSubject<BulkQuote | null>(null);
  quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
  quotesSubs?:Subscription;
  allQuotes: Quote[] = [];
  quotesNotProcessed: Quote[] = [];

  @ViewChild("nav") // Get a reference to the ngbNav
  navBar!:NgbNav;

  constructor(private _route: ActivatedRoute, private _bulkQuotesSvc: BulkQuotesService, private _quotesSvc: QuotesService, private _messageService: MessageService, private _modalService: NgbModal) {

  }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);
    if(this._route.snapshot.routeConfig?.path === this._bulkQuotesSvc.hubId){
      this._bulkQuoteId = this._bulkQuotesSvc.hubId;
    }else{
      this._bulkQuoteId = this._route.snapshot.paramMap.get('id');
    }

    if (!this._bulkQuoteId) {
      throw new Error("invalid bulkQuote id");
    }

    await this._fetchQuote(this._bulkQuoteId);

    await this._fetchAllQuotes();

    this.allQuotes = this.quotes.value.filter(item => {
      return item.bulkQuoteId === this._bulkQuoteId
    })
    this.quotesNotProcessed = this.quotes.value.filter(item => this.bulkQuote.value?.quotesNotProcessedIds.includes(item.bulkQuoteId))
  }

  private async _fetchQuote(id: string):Promise<void> {
    return new Promise(resolve => {
      this._bulkQuotesSvc.getBulkQuote(id).subscribe(bulkQuote => {
        this.bulkQuote.next(bulkQuote);
        resolve();
      });
    });
  }

  private async _fetchAllQuotes():Promise<void> {
    return new Promise(resolve => {
      this._quotesSvc.getAllQuotes().subscribe(quotes => {
        this.quotes.next(quotes);
        resolve();
      });
    });
  }

  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }

  async copyQuoteIdToClipboard(){
    await navigator.clipboard.writeText(this.bulkQuote.value!.bulkQuoteId || "");
  }
}
