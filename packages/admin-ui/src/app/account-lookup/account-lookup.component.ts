import {Component, OnInit} from "@angular/core";

import {BehaviorSubject, Subscription} from "rxjs";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Oracle} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {InteropService} from '../_services_and_types/interop-service';
import {ParticipantsService} from '../_services_and_types/participants.service';
import {IParticipant} from '@mojaloop/participant-bc-public-types-lib';

@Component({
	selector: 'app-account-lookup',
	templateUrl: './account-lookup.component.html',
	styleUrls: ['./account-lookup.component.css']
})
export class AccountLookupComponent implements OnInit {

	public formAssociateParticipant!: FormGroup;
	public formDisassociateParticipant!: FormGroup;
	public formGetParticipant!: FormGroup;
	public formGetParty!: FormGroup;
	public submittedAssociateParticipant: boolean = false;
	// public submittedDisassociateParticipant : boolean = false;
	// public submittedGetParticipant : boolean = false;
	// public submittedGetParty : boolean = false;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	partyTypeList = ["MSISDN", "PERSONAL_ID", "BUSINESS", "DEVICE", "ACCOUNT_ID", "IBAN", "ALIAS"];
	currencyList: string[] = [];

	public participantId!: string;
	public participantCurrency!: string;

	constructor(private _interopSvc: InteropService, private _participantsSvc: ParticipantsService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("AccountLookupComponent ngOnInit");

		this.participantsSubs = this._participantsSvc.getAllParticipants().subscribe((list) => {
			console.log("ParticipantsComponent ngOnInit - got getAllParticipants");

			const forms = [this.formAssociateParticipant, this.formDisassociateParticipant, this.formGetParticipant, this.formGetParty];

			for (let i = 0; i < list.length; i += 1) {
				for (let j = 0; j < list[i].participantAccounts.length; j += 1) {
					this.currencyList.push(list[i].participantAccounts[j].currencyCode);
				}
			}

			// Remove currency duplicates
			this.currencyList = this.currencyList.filter((item, index) => this.currencyList.indexOf(item) === index);

			for (let i = 0; i < forms.length; i += 1) {
				forms[i].controls['participantId'].setValue(list[0].id);
				forms[i].controls['partyType'].setValue(this.partyTypeList[0]);
				forms[i].controls['currencyCode'].setValue(this.currencyList[0]);
			}

			this.participants.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

		this.formAssociateParticipant = new FormGroup({
			"participantId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyType": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"currencyCode": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partySubType": new FormControl("", [
				Validators.minLength(1)
			])
		});

		this.formDisassociateParticipant = new FormGroup({
			"participantId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyType": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"currencyCode": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partySubType": new FormControl("", [
				Validators.minLength(1)
			])
		});

		this.formGetParticipant = new FormGroup({
			"participantId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyType": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"currencyCode": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partySubType": new FormControl("", [
				Validators.minLength(1)
			])
		});

		this.formGetParty = new FormGroup({
			"participantId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyType": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"currencyCode": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partyId": new FormControl("", [
				Validators.required,
				Validators.minLength(1)
			]),
			"partySubType": new FormControl("", [
				Validators.minLength(1)
			])
		});

	}

	async associateParticipant() {
		this._interopSvc.associateParticipant(this.formAssociateParticipant.controls["participantId"].value, this.formAssociateParticipant.controls["partyType"].value, this.formAssociateParticipant.controls["partyId"].value, this.formAssociateParticipant.controls["partySubType"].value, this.formAssociateParticipant.controls["currencyCode"].value).subscribe(result => {
			if (!result) {
				this._messageService.addSuccess("associateParticipant event sucessfully sent");
			} else {
				this._messageService.addError("Something went wrong sending the associateParticipant event");
			}
		});
	}

	async disassociateParticipant() {
		this._interopSvc.disassociateParticipant(this.formDisassociateParticipant.controls["participantId"].value, this.formDisassociateParticipant.controls["partyType"].value, this.formDisassociateParticipant.controls["partyId"].value, this.formDisassociateParticipant.controls["partySubType"].value, this.formDisassociateParticipant.controls["currencyCode"].value).subscribe(result => {
			if (!result) {
				this._messageService.addSuccess("disassociateParticipant event sucessfully sent");
			} else {
				this._messageService.addError("Something went wrong sending the disassociateParticipant event");
			}
		});
	}

	async getParticipant() {
		this._interopSvc.getParticipant(this.formGetParticipant.controls["participantId"].value, this.formGetParticipant.controls["partyType"].value, this.formGetParticipant.controls["partyId"].value, this.formGetParticipant.controls["partySubType"].value, this.formGetParticipant.controls["currencyCode"].value).subscribe(result => {
			if (!result) {
				this._messageService.addSuccess("getParticipant event sucessfully sent");
			} else {
				this._messageService.addError("Something went wrong sending the getParticipant event");
			}
		});
	}

	async getParty() {
		this._interopSvc.getParty(this.formGetParty.controls["participantId"].value, this.formGetParty.controls["partyType"].value, this.formGetParty.controls["partyId"].value, this.formGetParty.controls["partySubType"].value, this.formGetParty.controls["currencyCode"].value).subscribe(result => {
			if (!result) {
				this._messageService.addSuccess("getParty event sucessfully sent");
			} else {
				this._messageService.addError("Something went wrong sending the getParty event");
			}
		});
	}

}
