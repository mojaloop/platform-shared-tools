import {Component, OnInit} from "@angular/core";
import {MessageService} from 'src/app/_services_and_types/message.service';
import {
	FormControl,
	FormGroup,
	Validators,
} from '@angular/forms';
import {SettlementsService} from "../_services_and_types/settlements.service";
import {ISettlementConfig} from "@mojaloop/settlements-bc-public-types-lib";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.models.create.component.html',
})
export class SettlementsModelsCreateComponent implements OnInit {
	public form!: FormGroup;
	public model: ISettlementConfig = this._settlementsService.createEmptyModel();
	public submitted = false;

	constructor(private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		this.form = new FormGroup({
			name: new FormControl(this.model.settlementModel, [
				Validators.required,
				Validators.minLength(3),
			]),
			batchCreateInterval: new FormControl(this.model.batchCreateInterval, [
				Validators.required,
				Validators.pattern(/[0-9]+/g)
			]),
			isActive: new FormControl(this.model.isActive, [
				Validators.required
			])
		});
	}

	create() {
		this.submitted = true;

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Model");
			return;
		}

		// update model from form
		this.model.settlementModel = this.form.controls["name"].value;
		this.model.batchCreateInterval = this.form.controls["batchCreateInterval"].value;

		this._settlementsService.createSettlementModel(
			null,
			this.model.settlementModel,
			this.model.batchCreateInterval).subscribe(createdID => {
			this._messageService.addSuccess("Settlement Model Created");
			history.back();
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	cancel() {
		history.back();
	}
}
