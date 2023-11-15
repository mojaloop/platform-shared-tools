import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {InteropService} from '../_services_and_types/interop-service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {Quote} from "src/app/_services_and_types/quote_types";
import {QuotesService} from "../_services_and_types/quotes.service";
import {IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {ParticipantsService} from "../_services_and_types/participants.service";
import * as uuid from "uuid";
import {removeEmpty} from '../_utils';
import { BulkQuotesService } from "../_services_and_types/bulk-quotes.service";
import { BulkTransfersService } from "../_services_and_types/bulk-transfers.service";
import { BulkTransfer } from "../_services_and_types/bulk_transfer_types";
import { debug } from "console";

@Component({
	selector: 'app-bulk-transfer-create',
	templateUrl: './bulk-transfer-create.component.html'
})
export class BulkTransferCreateComponent implements OnInit {
	public form!: FormGroup;
	public isNewTransfer: boolean = false;
	public submitted: boolean = false;
	public inputQuoteId: string | null = null;

	public activeBulkTransfer: BulkTransfer | null = null;
	public activeTransfer: Transfer | null = null;
	public selectedQuoteId: string | null = null;

	currencyCodeList = ["EUR", "USD", "TZS"];

	quotes: BehaviorSubject<Quote[]> = new BehaviorSubject<Quote[]>([]);
	quotesSubs?: Subscription;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	constructor(private _router: Router, private _route: ActivatedRoute, private _bulkTransfersSvc: BulkTransfersService, private _transfersSvc: TransfersService, private _interopSvc: InteropService, private _bulkQuotesSvc: BulkQuotesService, private _quotesSvc: QuotesService, private _participantsSvc: ParticipantsService, private _messageService: MessageService) {
	}

	async ngOnInit(): Promise<void> {
		console.log("TransfersCreateComponent ngOnInit");
		this.inputQuoteId = this._route.snapshot.queryParamMap.get('quoteId') || null;

		this._initForm();
		this.isNewTransfer = true;
		this.newTransfer();

		try {
			const participantsRes = await this._participantsSvc.getAllParticipants().toPromise();
			const onlyDfsps = participantsRes.items.filter(value => value.id !== "hub");
			this.participants.next(onlyDfsps);

			if (!this.inputQuoteId) {
				const quotes = await this._quotesSvc.getAllQuotes().toPromise();
				quotes.reverse();
				this.quotes.next(quotes);
				this.form.controls["selectedQuoteId"].setValue(quotes[0].quoteId);
			} else {
				const quote = await this._quotesSvc.getQuote(this.inputQuoteId).toPromise();
				if(!quote){
					this._messageService.addError("Could not get quote by id");
					return;
				}
				this.quotes.next([quote]);
				this.form.controls["selectedQuoteId"].setValue(this.inputQuoteId);
				this.applyQuote(this.inputQuoteId);
			}

		} catch (error: any) {
			this._messageService.addError(error.message || error);
		}


	}

	newTransfer() {
		this.activeBulkTransfer = this._bulkTransfersSvc.createEmptyBulkTransfer();
		this.activeTransfer = this._transfersSvc.createEmptyTransfer();
	}

	private _initForm() {
		this.form = new FormGroup({
			"bulkTransferId": new FormControl(this.activeBulkTransfer?.bulkTransferId, Validators.required),
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
		if (!this.activeBulkTransfer) throw new Error("invalid activeBulkTransfer");
		if (!this.activeTransfer) throw new Error("invalid activeTransfer");

		this.submitted = true;

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Transfer");
			return;
		}

		// update active Transfer from form
		this.activeBulkTransfer.bulkTransferId = this.form.controls["bulkTransferId"].value;

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
		if (existing) {
			this._messageService.addError("A transfer with that id already exists");
			return;
		}


		const transfer = removeEmpty(this.activeTransfer) as Transfer;

		const individualTransfers = [];

		for(let i=1 ; i<51 ; i+=1) {
			individualTransfers.push({
				"transferId": i >= 10 ? i + transfer.transferId.slice(2) : i + transfer.transferId.slice(1),
				"transferAmount": {
					"currency": "USD",
					"amount": "10"
				},
				"ilpPacket": "AYICbQAAAAAAAAPoHGcuYmx1ZWJhbmsubXNpc2RuLmJsdWVfYWNjXzGCAkRleUowY21GdWMyRmpkR2x2Ymtsa0lqb2lPV1kxWkRrM09EUXRNMkUxTnkwMU9EWTFMVGxoWVRBdE4yUmtaVGMzT1RFMU5EZ3hJaXdpY1hWdmRHVkpaQ0k2SW1ZMU5UaGtORFE0TFRCbU1UQXROREF4TmkwNE9ESXpMVEU1TjJObU5qZ3haamhrWmlJc0luQmhlV1ZsSWpwN0luQmhjblI1U1dSSmJtWnZJanA3SW5CaGNuUjVTV1JVZVhCbElqb2lUVk5KVTBST0lpd2ljR0Z5ZEhsSlpHVnVkR2xtYVdWeUlqb2lZbXgxWlY5aFkyTmZNU0lzSW1aemNFbGtJam9pWW14MVpXSmhibXNpZlgwc0luQmhlV1Z5SWpwN0luQmhjblI1U1dSSmJtWnZJanA3SW5CaGNuUjVTV1JVZVhCbElqb2lUVk5KVTBST0lpd2ljR0Z5ZEhsSlpHVnVkR2xtYVdWeUlqb2laM0psWlc1ZllXTmpYekVpTENKbWMzQkpaQ0k2SW1keVpXVnVZbUZ1YXlKOWZTd2lZVzF2ZFc1MElqcDdJbU4xY25KbGJtTjVJam9pUlZWU0lpd2lZVzF2ZFc1MElqb2lNVEFpZlN3aWRISmhibk5oWTNScGIyNVVlWEJsSWpwN0luTmpaVzVoY21sdklqb2lSRVZRVDFOSlZDSXNJbWx1YVhScFlYUnZjaUk2SWxCQldVVlNJaXdpYVc1cGRHbGhkRzl5Vkhsd1pTSTZJa0pWVTBsT1JWTlRJbjE5AA",
				"condition": "STksBXN1-J5HnG_4owlzKnbmzCfiOlrKDPgiR-QZ7Kg"
			})
		}
		
		const bulkTransfer = {
			"bulkTransferId": "0fbee1f3-c58e-5afe-8cdd-7e65eea2fca9",
			"bulkQuoteId": "3854fdbe-5dea-3abd-a210-8780e7f2f1f4",
			"payeeFsp": "greenbank",
			"payerFsp": "bluebank",
			"expiration": this.activeTransfer.expiration,
			"individualTransfers": individualTransfers
		} as unknown as BulkTransfer

		this._interopSvc.createBulkTransferRequest(bulkTransfer).subscribe(success => {
			this._messageService.addSuccess("Bulk Transfer Created");

			setTimeout(() => {
				this._router.navigateByUrl(`/bulk-transfers/${this.activeBulkTransfer!.bulkTransferId}?live`);
			}, 250);
		}, error => {
			this._messageService.addError(error.message);
		});


	}

	applyQuote(quoteId?: string) {
		if (!quoteId) {
			const elem = document.getElementById("selectedQuoteId") as HTMLSelectElement;
			if (!elem) throw new Error("Could not find selectedQuoteId select html element");

			quoteId = elem.value;
		}
		const selectedQuote = this.quotes.value.find(quote => quote.quoteId === quoteId);
		
		this.form.controls["bulkTransferId"].setValue("0fbee1f3-c58e-5afe-8cdd-7e65eea2fca9");
		this.form.controls["transferId"].setValue("1fbee2f3-c58e-5afe-8cdd-6e65eea2fca9");
		this.form.controls["payeeFsp"].setValue(selectedQuote?.payee?.partyIdInfo.fspId);
		this.form.controls["payerFsp"].setValue("bluebank");
		this.form.controls["amount"].setValue(selectedQuote?.amount?.amount);
		this.form.controls["currency"].setValue(selectedQuote?.amount?.currency);
		this.form.controls["ilpPacket"].setValue(selectedQuote?.ilpPacket);
		this.form.controls["condition"].setValue(selectedQuote?.condition);
		this.form.controls["expiration"].setValue(new Date(Date.now() + 3600 * 1000).toISOString());
	}

	genNewId() {
		this.form.controls["transferId"].setValue(uuid.v4());
	}

	genNewExpiration() {
		this.form.controls["expiration"].setValue(new Date(Date.now() + 3600 * 1000).toISOString());
	}

	cancel() {
		this.activeTransfer = null;
		history.back();
	}

}
