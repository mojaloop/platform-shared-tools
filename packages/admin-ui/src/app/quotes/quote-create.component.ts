import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import { InteropService } from '../_services_and_types/interop-service';

const removeEmpty = (obj: any) => {
  Object.entries(obj).forEach(([key, val])  =>
    (val && typeof val === 'object') && removeEmpty(val) ||
    (val === null || val === "") && delete obj[key]
  );
  return obj;
};

@Component({
  selector: 'app-quote-create',
  templateUrl: './quote-create.component.html'
})
export class QuoteCreateComponent implements OnInit {
  public form!: FormGroup;
  public isNewQuote:boolean = false;
  public submitted : boolean = false;

  public activeQuote: Quote|null = null

  constructor(private _route: ActivatedRoute, private _quotesSvc:QuotesService, private _interopSvc:InteropService, private _messageService: MessageService) { }

  async ngOnInit():Promise<void> {
    this._initForm();

    this.isNewQuote = true;
    this.newQuote();
  }


  newQuote(){
    this.activeQuote = this._quotesSvc.createEmptyQuote();
    // this._updateFormWithActiveQuote();
  }

  private _initForm() {
    this.form = new FormGroup({
      "quoteId": new FormControl(this.activeQuote?.quoteId, Validators.required),
      "bulkQuoteId": new FormControl(this.activeQuote?.bulkQuoteId),
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

  async saveQuote(){
    if(!this.activeQuote) throw new Error("invalid activeQuote");

    this.submitted = true;

    if(!this.form.valid){
      console.table(this.form.value);
      this._messageService.addError("Invalid Quote");
      return;
    }

    // update active Quote from form
    this.activeQuote.quoteId =  this.form.controls["quoteId"].value;
    this.activeQuote.bulkQuoteId =  this.form.controls["bulkQuoteId"].value;
    this.activeQuote.transactionId =  this.form.controls["transactionId"].value;
    this.activeQuote.payee =  {
      "partyIdInfo": {
        "partyIdType": this.form.controls["payeePartyIdType"].value,
        "partyIdentifier": this.form.controls["payeePartyIdentifier"].value,
        "partySubIdOrType": this.form.controls["payeePartySubIdOrType"].value,
        "fspId": this.form.controls["payeeFspId"].value,
      }
    }
    this.activeQuote.payer =  {
      "partyIdInfo": {
        "partyIdType": this.form.controls["payerPartyIdType"].value,
        "partyIdentifier": this.form.controls["payerPartyIdentifier"].value,
        "partySubIdOrType": this.form.controls["payerPartySubIdOrType"].value,
        "fspId": this.form.controls["payerFspId"].value,
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

    const quote = removeEmpty(this.activeQuote) as Quote;
    
    const success = this._interopSvc.createQuoteRequest(quote).subscribe(success => {
      if(!success)
        throw new Error("error saving Quote");

      this._messageService.addSuccess("Quote Created");
      history.back();
    });


  }

  applyQuoteExample() {
    const exampleQuote = {
      quoteId: "8243fdba-5dea-3abd-a210-3780e7f2f1f4",
      transactionId: "9f5d9784-3a57-5865-9aa0-7dde7791548a",
      payer: {
          partyIdInfo: {
              partyIdType: "MSISDN",
              partyIdentifier: "123",
              partySubIdOrType: null,
              fspId: "Bluebank"
          }
      },
      payee: {
          partyIdInfo: {
              partyIdType: "MSISDN",
              partyIdentifier: "456",
              partySubIdOrType: null,
              fspId: "Greenbank"
          }
      },
      amountType: "SEND",
      amount: {
          currency: "EUR",
          amount: "1"
      },
      transactionType: {
          scenario: "DEPOSIT",
          initiator: "PAYER",
          initiatorType: "BUSINESS"
      }
  }

    this.form.controls["quoteId"].setValue(exampleQuote.quoteId);
    this.form.controls["transactionId"].setValue(exampleQuote.transactionId);
    this.form.controls["payeePartyIdType"].setValue(exampleQuote.payee.partyIdInfo.partyIdType);
    this.form.controls["payeePartyIdentifier"].setValue(exampleQuote.payee.partyIdInfo.partyIdentifier);
    this.form.controls["payeePartySubIdOrType"].setValue(exampleQuote.payee.partyIdInfo.partySubIdOrType);
    this.form.controls["payeeFspId"].setValue(exampleQuote.payee.partyIdInfo.fspId);
    this.form.controls["payerPartyIdType"].setValue(exampleQuote.payer.partyIdInfo.partyIdType);
    this.form.controls["payerPartyIdentifier"].setValue(exampleQuote.payer.partyIdInfo.partyIdentifier);
    this.form.controls["payerPartySubIdOrType"].setValue(exampleQuote.payer.partyIdInfo.partySubIdOrType);
    this.form.controls["payerFspId"].setValue(exampleQuote.payer.partyIdInfo.fspId);
    this.form.controls["amountType"].setValue(exampleQuote.amountType);
    this.form.controls["currency"].setValue(exampleQuote.amount.currency);
    this.form.controls["amount"].setValue(exampleQuote.amount.amount);
    this.form.controls["scenario"].setValue(exampleQuote.transactionType.scenario);
    this.form.controls["initiator"].setValue(exampleQuote.transactionType.initiator);
    this.form.controls["initiatorType"].setValue(exampleQuote.transactionType.initiatorType);
  }

  cancel(){
    this.activeQuote = null;
    history.back();
  }
  
}
