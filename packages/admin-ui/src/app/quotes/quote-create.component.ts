import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "src/app/_services_and_types/quotes.service";
import {InteropService} from "../_services_and_types/interop-service";
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "../_services_and_types/errors";
import {IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {ParticipantsService} from "../_services_and_types/participants.service";
import * as uuid from "uuid";
import {removeEmpty} from "../_utils";

@Component({
	selector: 'app-quote-create',
	templateUrl: './quote-create.component.html'
})
export class QuoteCreateComponent implements OnInit {
	public form!: FormGroup;
	public isNewQuote: boolean = false;
	public submitted: boolean = false;

	public activeQuote: Quote | null = null;
	partyIdTypeList = ["MSISDN", "PERSONAL_ID", "BUSINESS", "DEVICE", "ACCOUNT_ID", "IBAN", "ALIAS"];
	amountTypeList = ["SEND", "RECEIVE"];
	currencyCodeList = ["EUR", "USD", "TZS"];
	scenarioList = ["DEPOSIT", "WITHDRAWAL", "REFUND"];
	initiatorList = ["PAYER", "PAYEE"];
	initiatorTypeList = ["CONSUMER", "AGENT", "BUSINESS"];

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	constructor(private _router: Router, private _route: ActivatedRoute, private _quotesSvc: QuotesService, private _interopSvc: InteropService, private _participantsSvc: ParticipantsService, private _messageService: MessageService) {
	}

	async ngOnInit(): Promise<void> {
		this.participantsSubs = this._participantsSvc.getAllParticipants().subscribe((list) => {
			console.log("TransferCreateComponent ngOnInit - got getAllParticipants");

			const onlyDfsps = list.items.filter(value => value.id !== "hub");

			this.form.controls["payeeFspId"].setValue(onlyDfsps[0].id);
			this.form.controls["payerFspId"].setValue(onlyDfsps[0].id);

			this.participants.next(onlyDfsps);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

		this._initForm();

		this.isNewQuote = true;
		this.newQuote();
	}


	newQuote() {
		this.activeQuote = this._quotesSvc.createEmptyQuote();
		// this._updateFormWithActiveQuote();
	}

	private _initForm() {
		this.form = new FormGroup({
			"quoteId": new FormControl(this.activeQuote?.quoteId, Validators.required),
			"bulkQuoteId": new FormControl(this.activeQuote?.bulkQuoteId),
			"transactionId": new FormControl(this.activeQuote?.transactionId, Validators.required),
			"payeePartyIdType": new FormControl(this.partyIdTypeList[0], Validators.required),
			"payeePartyIdentifier": new FormControl(this.activeQuote?.payeePartyIdentifier, Validators.required),
			"payeePartySubIdOrType": new FormControl(this.activeQuote?.payerPartyIdentifier),
			"payeeFspId": new FormControl(this.activeQuote?.payeeFspId),
			"payerPartyIdType": new FormControl(this.partyIdTypeList[0], Validators.required),
			"payerPartyIdentifier": new FormControl(this.activeQuote?.payerPartyIdentifier, Validators.required),
			"payerPartySubIdOrType": new FormControl(this.activeQuote?.payerPartyIdentifier),
			"payerFspId": new FormControl(this.activeQuote?.payerFspId),
			"amountType": new FormControl(this.amountTypeList[0], Validators.required),
			"currency": new FormControl(this.currencyCodeList[0], Validators.required),
			"amount": new FormControl(this.activeQuote?.amount, Validators.required),
			"scenario": new FormControl(this.scenarioList[0], Validators.required),
			"initiator": new FormControl(this.initiatorList[0], Validators.required),
			"initiatorType": new FormControl(this.initiatorTypeList[0], Validators.required),
		});
	}

	async saveQuote() {
		if (!this.activeQuote) throw new Error("invalid activeQuote");

		this.submitted = true;

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Quote");
			return;
		}

		// update active Quote from form
		this.activeQuote.quoteId = this.form.controls["quoteId"].value;
		this.activeQuote.bulkQuoteId = this.form.controls["bulkQuoteId"].value;
		this.activeQuote.transactionId = this.form.controls["transactionId"].value;
		this.activeQuote.payee = {
			"partyIdInfo": {
				"partyIdType": this.form.controls["payeePartyIdType"].value,
				"partyIdentifier": this.form.controls["payeePartyIdentifier"].value,
				"partySubIdOrType": this.form.controls["payeePartySubIdOrType"].value,
				"fspId": this.form.controls["payeeFspId"].value,
			}
		};
		this.activeQuote.payer = {
			"partyIdInfo": {
				"partyIdType": this.form.controls["payerPartyIdType"].value,
				"partyIdentifier": this.form.controls["payerPartyIdentifier"].value,
				"partySubIdOrType": this.form.controls["payerPartySubIdOrType"].value,
				"fspId": this.form.controls["payerFspId"].value,
			}
		};
		this.activeQuote.amountType = this.form.controls["amountType"].value;
		this.activeQuote.amount = {
			"currency": this.form.controls["currency"].value,
			"amount": this.form.controls["amount"].value,
		};
		this.activeQuote.transactionType = {
			"scenario": this.form.controls["scenario"].value,
			"initiator": this.form.controls["initiator"].value,
			"initiatorType": this.form.controls["initiatorType"].value
		};

		const quote = removeEmpty(this.activeQuote) as Quote;

		this._interopSvc.createQuoteRequest(quote).subscribe(success => {
			this._messageService.addSuccess("Quote Created");
			setTimeout(() => {
				this._router.navigateByUrl(`/quotes/${this.activeQuote!.quoteId}?live`);
			}, 500);
		}, error => {
			console.error(error);
			this._messageService.addError("Quote Creation error: " + error.toString());
		});


	}

	applyQuoteExample() {
		const exampleQuote = {
			quoteId: uuid.v4(),
			transactionId: uuid.v4(),
			payer: {
				partyIdInfo: {
					partyIdType: "MSISDN",
					partyIdentifier: "123",
					partySubIdOrType: null,
					fspId: "greenbank"
				}
			},
			payee: {
				partyIdInfo: {
					partyIdType: "MSISDN",
					partyIdentifier: "456",
					partySubIdOrType: null,
					fspId: "bluebank"
				}
			},
			amountType: "SEND",
			amount: {
				currency: "EUR",
				amount: "10"
			},
			transactionType: {
				scenario: "DEPOSIT",
				initiator: "PAYER",
				initiatorType: "BUSINESS"
			}
		};

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

	cancel() {
		this.activeQuote = null;
		history.back();
	}

}
