import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IParticipant, ParticipantTypes} from "@mojaloop/participant-bc-public-types-lib";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";

@Component({
	selector: 'app-participant-create',
	templateUrl: './participant-create.component.html'
})
export class ParticipantCreateComponent implements OnInit {
	public form!: FormGroup;
	public isNewParticipant: boolean = false;
	public submitted: boolean = false;

	public activeParticipant: IParticipant | null = null;

	public participantTypes: Record<Extract<keyof typeof ParticipantTypes, 'DFSP' | 'FXP'>, string> = {
		DFSP: "DFSP",
		FXP:  "Foreign Exchange Provider",
	};

	constructor(private _route: ActivatedRoute, private _participantsSvc: ParticipantsService, private _messageService: MessageService) {
	}

	async ngOnInit(): Promise<void> {
		this._initForm();

		this.isNewParticipant = true;
		this.newParticipant();
	}


	newParticipant() {
		this.activeParticipant = this._participantsSvc.createEmptyParticipant();
		this._updateFormWithActiveParticipant();
	}

	private _initForm() {
		this.form = new FormGroup({
			"id": new FormControl(this.activeParticipant?.id, Validators.required),
			"name": new FormControl(this.activeParticipant?.name, Validators.required),
			"description": new FormControl(this.activeParticipant?.description, Validators.required),
			"createdDate": new FormControl(this.activeParticipant?.createdDate, Validators.required),

			"isActive": new FormControl(this.activeParticipant?.isActive),
			"createdBy": new FormControl(this.activeParticipant?.createdBy),
			"lastUpdated": new FormControl(this.activeParticipant?.lastUpdated),
		});
	}

	private _updateFormWithActiveParticipant() {
		if (!this.activeParticipant) throw new Error("invalid activeParticipant in _updateFormWithActiveParticipant()");

		this.form.controls["id"].setValue(this.activeParticipant.id);
		this.form.controls["name"].setValue(this.activeParticipant.name);
		this.form.controls["description"].setValue(this.activeParticipant.description);
		this.form.controls["createdDate"].setValue(new Date(this.activeParticipant.createdDate).toISOString());
		this.form.controls["isActive"].setValue(this.activeParticipant.isActive);
		this.form.controls["createdBy"].setValue(this.activeParticipant.createdBy);
		this.form.controls["lastUpdated"].setValue(new Date(this.activeParticipant.lastUpdated).toISOString());
	}

	async saveParticipant() {
		if (!this.activeParticipant) throw new Error("invalid activeParticipant");

		this.submitted = true;

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Participant");
			return;
		}

		// update active Participant from form
		this.activeParticipant.id = this.form.controls["id"].value;
		this.activeParticipant.name = this.form.controls["name"].value;
		this.activeParticipant.description = this.form.controls["description"].value;
		this.activeParticipant.type = this.form.controls['type'].value;


		// TODO actually save the participant
		this._participantsSvc.createParticipant(this.activeParticipant).subscribe(success => {
			if (!success)
				throw new Error("error saving Participant");

			this._messageService.addSuccess("Participant Created");
			history.back();
		});


	}

	cancel() {
		this.activeParticipant = null;
		history.back();
	}
}
