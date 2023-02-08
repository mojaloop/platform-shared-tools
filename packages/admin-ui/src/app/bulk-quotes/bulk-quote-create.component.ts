import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {BulkQuote} from "src/app/_services_and_types/bulk_quote_types";
import {BulkQuotesService} from "src/app/_services_and_types/bulk-quotes.service";
import { QuotesService } from '../_services_and_types/quotes.service';
import { InteropService } from '../_services_and_types/interop-service';
import { Quote } from '../_services_and_types/quote_types';

const removeEmpty = (obj: any) => {
  Object.entries(obj).forEach(([key, val])  =>
    (val && typeof val === 'object') && removeEmpty(val) ||
    (val === null || val === "") && delete obj[key]
  );
  return obj;
};

@Component({
  selector: 'app-bulk-quote-create',
  templateUrl: './bulk-quote-create.component.html'
})
export class BulkQuoteCreateComponent implements OnInit {
  public form!: FormGroup;
  public submitted : boolean = false;

  public activeBulkQuote: BulkQuote|null = null
  public activeQuote: Quote|null = null

  constructor(private _route: ActivatedRoute, private _bulkQuotesSvc:BulkQuotesService, private _quotesSvc:QuotesService, private _interopSvc:InteropService, private _messageService: MessageService) { }

  async ngOnInit():Promise<void> {
    this._initForm();

    this.newBulkQuote();
  }


  newBulkQuote(){
    this.activeBulkQuote = this._quotesSvc.createEmptyBulkQuote();
    this.activeQuote = this._quotesSvc.createEmptyQuote();
  }

  private _initForm() {
    this.form = new FormGroup({
      "bulkQuoteId": new FormControl(this.activeBulkQuote?.bulkQuoteId, Validators.required),
      "quoteId": new FormControl(this.activeQuote?.quoteId, Validators.required),
      "transactionId": new FormControl(this.activeQuote?.transactionId, Validators.required),
      "payeePartyIdType": new FormControl(this.activeQuote?.payeePartyIdType, Validators.required),
      "payeePartyIdentifier": new FormControl(this.activeQuote?.payeePartyIdentifier, Validators.required),
      "payeePartySubIdOrType": new FormControl(this.activeQuote?.payerPartyIdentifier),
      "payeeFspId": new FormControl(this.activeQuote?.payeeFspId),
      "payerPartyIdType": new FormControl(this.activeQuote?.payerPartyIdType, Validators.required),
      "payerPartyIdentifier": new FormControl(this.activeQuote?.payerPartyIdentifier, Validators.required),
      "payerPartySubIdOrType": new FormControl(this.activeQuote?.payerPartyIdentifier),
      "payerFspId": new FormControl(this.activeQuote?.payerFspId),
      "amountType": new FormControl(this.activeQuote?.amountType, Validators.required),
      "currency": new FormControl(this.activeQuote?.currency, Validators.required),
      "amount": new FormControl(this.activeQuote?.amount, Validators.required),
      "scenario": new FormControl(this.activeQuote?.scenario, Validators.required),
      "initiator": new FormControl(this.activeQuote?.initiator, Validators.required),
      "initiatorType": new FormControl(this.activeQuote?.initiatorType, Validators.required),
    });
  }

  async saveBulkQuote(){
    if(!this.activeBulkQuote || !this.activeQuote) throw new Error("invalid activeBulkQuote");

    this.submitted = true;

    if(!this.form.valid){
      console.table(this.form.value);
      this._messageService.addError("Invalid BulkQuote");
      return;
    }

    // update active BulkQuote from form

    // Bulk Quote
    this.activeBulkQuote.bulkQuoteId =  this.form.controls["bulkQuoteId"].value;
    this.activeBulkQuote.payer =  {
      "partyIdInfo": {
        "partyIdType": this.form.controls["payerPartyIdType"].value,
        "partyIdentifier": this.form.controls["payerPartyIdentifier"].value,
        "partySubIdOrType": this.form.controls["payerPartySubIdOrType"].value,
        "fspId": this.form.controls["payerFspId"].value,
      }
    }

    // Quote
    this.activeQuote.quoteId =  this.form.controls["quoteId"].value;
    this.activeQuote.transactionId =  this.form.controls["transactionId"].value;
    this.activeQuote.payee =  {
      "partyIdInfo": {
        "partyIdType": this.form.controls["payeePartyIdType"].value,
        "partyIdentifier": this.form.controls["payeePartyIdentifier"].value,
        "partySubIdOrType": this.form.controls["payeePartySubIdOrType"].value,
        "fspId": this.form.controls["payeeFspId"].value,
      }
    }
    this.activeQuote.amountType =  this.form.controls["amountType"].value;
    this.activeQuote.amount =  {
      "currency": this.form.controls["currency"].value,
      "amount": this.form.controls["amount"].value,
    };
    this.activeQuote.transactionType =  {
      "scenario": this.form.controls["scenario"].value,
      "initiator": this.form.controls["initiator"].value,
      "initiatorType": this.form.controls["initiatorType"].value
    }

    const quote = removeEmpty(this.activeBulkQuote) as BulkQuote;
    
    const success = this._interopSvc.createBulkQuoteRequest(quote).subscribe(success => {
      if(!success)
        throw new Error("error saving BulkQuote");

      this._messageService.addSuccess("BulkQuote Created");
      history.back();
    });


  }

  cancel(){
    this.activeBulkQuote = null;
    history.back();
  }
}
