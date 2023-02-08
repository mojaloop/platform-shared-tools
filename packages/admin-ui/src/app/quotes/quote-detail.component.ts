import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {BehaviorSubject} from "rxjs";
import {NgbModal, NgbNav} from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-quote-detail',
  templateUrl: './quote-detail.component.html'
})
export class QuoteDetailComponent implements OnInit {
  private _quoteId: string | null = null;
  public quote: BehaviorSubject<Quote | null> = new BehaviorSubject<Quote | null>(null);

  @ViewChild("nav") // Get a reference to the ngbNav
  navBar!:NgbNav;

  constructor(private _route: ActivatedRoute, private _quotesSvc: QuotesService, private _messageService: MessageService, private _modalService: NgbModal) {

  }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);
    if(this._route.snapshot.routeConfig?.path === this._quotesSvc.hubId){
      this._quoteId = this._quotesSvc.hubId;
    }else{
      this._quoteId = this._route.snapshot.paramMap.get('id');
    }

    if (!this._quoteId) {
      throw new Error("invalid quote id");
    }

    this._fetchQuote(this._quoteId);
  }

  private async _fetchQuote(id: string):Promise<void> {
    return new Promise(resolve => {
      this._quotesSvc.getQuote(id).subscribe(quote => {
        this.quote.next(quote);
        resolve();
      });
    });

  }

  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }


  async copyQuoteIdToClipboard(){
    await navigator.clipboard.writeText(this.quote.value!.quoteId || "");
  }
}
