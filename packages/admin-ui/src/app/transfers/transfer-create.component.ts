import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import { InteropService } from '../_services_and_types/interop-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UnauthorizedError } from '../_services_and_types/errors';
import { Quote } from "src/app/_services_and_types/quote_types";
import { QuotesService } from '../_services_and_types/quotes.service';

const removeEmpty = (obj: any) => {
  Object.entries(obj).forEach(([key, val])  =>
    (val && typeof val === 'object') && removeEmpty(val) ||
    (val === null || val === "") && delete obj[key]
  );
  return obj;
};

@Component({
  selector: 'app-transfer-create',
  templateUrl: './transfer-create.component.html'
})
export class TransferCreateComponent implements OnInit {
  public form!: FormGroup;
  public isNewTransfer: boolean = false;
  public submitted: boolean = false;

  public activeTransfer: Transfer | null = null
  public selectedQuoteId: string | null = null;

  quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
  quotesSubs?:Subscription;
  
  constructor(private _route: ActivatedRoute, private _transfersSvc:TransfersService, private _interopSvc:InteropService, private _quotesSvc:QuotesService, private _messageService: MessageService) { }

  async ngOnInit():Promise<void> {
    console.log("TransfersCreateComponent ngOnInit");

    this.quotesSubs = this._quotesSvc.getAllQuotes().subscribe((list) => {
      console.log("TransfersCreateComponent ngOnInit - got getAllQuotes");

      this.form.controls["selectedQuoteId"].setValue(list[0].quoteId);
      this.quotes.next(list);
    }, error => {
      if(error && error instanceof UnauthorizedError){
        this._messageService.addError(error.message);
      }
    });

    this._initForm();

    this.isNewTransfer = true;
    this.newTransfer();
  }


  newTransfer(){
    this.activeTransfer = this._transfersSvc.createEmptyTransfer();
    // this._updateFormWithActiveTransfer();
  }

  private _initForm() {
    this.form = new FormGroup({
      "selectedQuoteId": new FormControl(this.selectedQuoteId),
      "transferId": new FormControl(this.activeTransfer?.transferId),
      "payeeFsp": new FormControl(this.activeTransfer?.payeeFsp),
      "payerFsp": new FormControl(this.activeTransfer?.payerFsp),
      "currency": new FormControl(this.activeTransfer?.currency, Validators.required),
      "amount": new FormControl(this.activeTransfer?.amount, Validators.required),
      "ilpPacket": new FormControl(this.activeTransfer?.ilpPacket, Validators.required),
      "condition": new FormControl(this.activeTransfer?.condition, Validators.required),
      "expiration": new FormControl(this.activeTransfer?.expiration, Validators.required),
    });
  }

  async saveTransfer(){
    debugger

    if(!this.activeTransfer) throw new Error("invalid activeTransfer");

    this.submitted = true;

    if(!this.form.valid){
      console.table(this.form.value);
      this._messageService.addError("Invalid Transfer");
      return;
    }

    // update active Transfer from form
    this.activeTransfer.transferId =  this.form.controls["transferId"].value;
    this.activeTransfer.payeeFsp =  this.form.controls["payeeFsp"].value;
    this.activeTransfer.payerFsp =  this.form.controls["payerFsp"].value;
    this.activeTransfer.amount =  {
      "currency": this.form.controls["currency"].value,
      "amount": this.form.controls["amount"].value,
    };
    this.activeTransfer.ilpPacket =  this.form.controls["ilpPacket"].value;
    this.activeTransfer.condition =  this.form.controls["condition"].value;
    this.activeTransfer.expiration =  this.form.controls["expiration"].value;


    const transfer = removeEmpty(this.activeTransfer) as Transfer;
    const success = this._interopSvc.createTransferRequest(transfer).subscribe(success => {
      if(!success)
        throw new Error("error saving Transfer");

      this._messageService.addSuccess("Transfer Created");
      history.back();
    });


  }

  applyQuote() {
    const selectedQuote = this.quotes.value.find(quote => quote.quoteId === this.form.controls["selectedQuoteId"].value);

    this.form.controls["transferId"].setValue(selectedQuote?.transactionId);
    this.form.controls["payeeFsp"].setValue(selectedQuote?.payee?.partyIdInfo.fspId);
    this.form.controls["payerFsp"].setValue(selectedQuote?.payer?.partyIdInfo.fspId);
    this.form.controls["amount"].setValue(selectedQuote?.amount?.amount);
    this.form.controls["currency"].setValue(selectedQuote?.amount?.currency);
    this.form.controls["ilpPacket"].setValue(selectedQuote?.ilpPacket);
    this.form.controls["condition"].setValue(selectedQuote?.condition);
    this.form.controls["expiration"].setValue(selectedQuote?.expiration);
  }

  cancel(){
    this.activeTransfer = null;
    history.back();
  }
  
}