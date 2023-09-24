import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {InteropService} from '../_services_and_types/interop-service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {UnauthorizedError} from '../_services_and_types/errors';
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from '../_services_and_types/quotes.service';
import {Participant} from '../_services_and_types/participant_types';
import {ParticipantsService} from '../_services_and_types/participants.service';
import * as uuid from "uuid";
import { removeEmpty } from '../_utils';

@Component({
	selector: 'app-transfer-create',
	templateUrl: './transfer-create.component.html'
})
export class TransferCreateComponent implements OnInit {
	public form!: FormGroup;
	public isNewTransfer: boolean = false;
	public submitted: boolean = false;
	public inputQuoteId: string | null = null;

	public activeTransfer: Transfer | null = null
	public selectedQuoteId: string | null = null;

	currencyCodeList = ["EUR", "USD", "TZS"];

	quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	quotesSubs?: Subscription;

	participants: BehaviorSubject<Participant[]> = new BehaviorSubject<Participant[]>([]);
	participantsSubs?: Subscription;

	constructor(private _router: Router, private _route: ActivatedRoute, private _transfersSvc: TransfersService, private _interopSvc: InteropService, private _quotesSvc: QuotesService, private _participantsSvc: ParticipantsService, private _messageService: MessageService) {
	}

	async ngOnInit(): Promise<void> {
		console.log("TransfersCreateComponent ngOnInit");
		this.inputQuoteId = this._route.snapshot.queryParamMap.get('quoteId') || null;

		this._initForm();
		this.isNewTransfer = true;
		this.newTransfer();

		try {
			let participants = await  this._participantsSvc.getAllParticipants().toPromise();
			participants = participants.filter(value => value.id!=="hub");
			this.participants.next(participants);

			const quotes = await this._quotesSvc.getAllQuotes().toPromise();
			quotes.reverse();
			this.quotes.next(quotes);

			if(!this.inputQuoteId){
				this.form.controls["selectedQuoteId"].setValue(quotes[0].quoteId);
			}else{
				this.form.controls["selectedQuoteId"].setValue(this.inputQuoteId);
				this.applyQuote(this.inputQuoteId);
			}

		}catch(error:any){
			this._messageService.addError(error.message || error);
		}



	}

	newTransfer() {
		this.activeTransfer = this._transfersSvc.createEmptyTransfer();
	}

	private _initForm() {
		this.form = new FormGroup({
			"selectedQuoteId": new FormControl(this.selectedQuoteId),
			"transferId": new FormControl(this.activeTransfer?.transferId, Validators.required),
			"payeeFsp": new FormControl(this.activeTransfer?.payeeFsp),
			"payerFsp": new FormControl(this.activeTransfer?.payerFsp),
			"currency": new FormControl(this.currencyCodeList[0], Validators.required),
			"amount": new FormControl(this.activeTransfer?.amount, Validators.required),
			"ilpPacket": new FormControl(this.activeTransfer?.ilpPacket),
			"condition": new FormControl(this.activeTransfer?.condition),
			"expiration": new FormControl(this.activeTransfer?.expiration, Validators.required),
		});
	}

	async saveTransfer() {
		if (!this.activeTransfer) throw new Error("invalid activeTransfer");

		this.submitted = true;

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Transfer");
			return;
		}

		// update active Transfer from form
		this.activeTransfer.transferId = this.form.controls["transferId"].value;
		this.activeTransfer.payeeFsp = this.form.controls["payeeFsp"].value;
		this.activeTransfer.payerFsp = this.form.controls["payerFsp"].value;
		this.activeTransfer.amount = {
			"currency": this.form.controls["currency"].value,
			"amount": this.form.controls["amount"].value,
		};
		this.activeTransfer.ilpPacket = this.form.controls["ilpPacket"].value;
		this.activeTransfer.condition = this.form.controls["condition"].value;
		this.activeTransfer.expiration = this.form.controls["expiration"].value;

		const existing = await this._transfersSvc.getTransfer(this.activeTransfer.transferId).toPromise();
		if(existing){
			this._messageService.addError("A transfer with that id already exists");
			return;
		}


		const transfer = removeEmpty(this.activeTransfer) as Transfer;
		const success = this._interopSvc.createTransferRequest(transfer).subscribe(success => {
			this._messageService.addSuccess("Transfer Created");

			setTimeout(()=>{
				this._router.navigateByUrl(`/transfers/${this.activeTransfer!.transferId}`);
			}, 250);
		}, error => {
			this._messageService.addError(error.message);
		});


	}

	applyQuote(quoteId?:string) {
		if (!quoteId){
			const elem = document.getElementById("selectedQuoteId") as HTMLSelectElement;
			if (!elem) throw new Error("Could not find selectedQuoteId select html element");

			quoteId = elem.value;
		}
		const selectedQuote = this.quotes.value.find(quote => quote.quoteId===quoteId);

		this.form.controls["transferId"].setValue(selectedQuote?.transactionId);
		this.form.controls["payeeFsp"].setValue(selectedQuote?.payee?.partyIdInfo.fspId);
		this.form.controls["payerFsp"].setValue(selectedQuote?.payer?.partyIdInfo.fspId);
		this.form.controls["amount"].setValue(selectedQuote?.amount?.amount);
		this.form.controls["currency"].setValue(selectedQuote?.amount?.currency);
		this.form.controls["ilpPacket"].setValue(selectedQuote?.ilpPacket);
		this.form.controls["condition"].setValue(selectedQuote?.condition);
		this.form.controls["expiration"].setValue(selectedQuote?.expiration);
	}

	genNewId(){
		this.form.controls["transferId"].setValue(uuid.v4());
	}

	genNewExpiration(){
		this.form.controls["expiration"].setValue(new Date(Date.now()+3600*1000).toISOString());
	}

	cancel() {
		this.activeTransfer = null;
		history.back();
	}

}
