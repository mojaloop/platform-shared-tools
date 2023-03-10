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
  private _live: boolean = false;
  private _reloadRequested: boolean = false;
  public quote: BehaviorSubject<Quote | null> = new BehaviorSubject<Quote | null>(null);

  private _reloadCount = 0;

  @ViewChild("nav") // Get a reference to the ngbNav
  navBar!:NgbNav;

  constructor(private _route: ActivatedRoute, private _quotesSvc: QuotesService, private _messageService: MessageService, private _modalService: NgbModal) {

  }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);
	this._quoteId = this._route.snapshot.paramMap.get('id');
    this._live = this._route.snapshot.queryParamMap.has('live');

    if (!this._quoteId) {
      throw new Error("invalid quote id");
    }

    this._fetchQuote(this._quoteId);
  }

  private async _fetchQuote(id: string):Promise<void> {
	  this._quotesSvc.getQuote(id).subscribe(quote => {
		this.quote.next(quote);

		if(this._live && !quote ||	 !(quote?.status === "REJECTED" ||  quote?.status === "ACCEPTED")){

			if(this._reloadCount > 30)  return;

			this._reloadCount++;
			this._reloadRequested = true;
			setTimeout(()=>{
				this._reloadCount++;
				this._fetchQuote(id);
			}, 1000);

		}else if(this._live && this._reloadRequested){
			this._messageService.addSuccess("Quote reloaded");
		}
	  });
  }



  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }


  async copyQuoteIdToClipboard(){
    await navigator.clipboard.writeText(this.quote.value!.quoteId || "");
  }
}
