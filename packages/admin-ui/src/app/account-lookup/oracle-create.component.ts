import {Component, OnInit} from "@angular/core";
import {MessageService} from 'src/app/_services_and_types/message.service';
import {Oracle} from 'src/app/_services_and_types/account-lookup_types';
import {AccountLookupService} from 'src/app/_services_and_types/account-lookup.service';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ValidationErrors,
	Validators,
} from '@angular/forms';

@Component({
	selector: 'app-account-lookup-oracle-edit',
	templateUrl: './oracle-create.component.html',
})
export class AccountLookupOracleCreateComponent implements OnInit {
	public form!: FormGroup;
	public oracle: Oracle = this._accountLookupService.createEmptyOracle();
	public registerError: string = '';
	public isBuiltinSelected: boolean = true;
	public submitted: boolean = false;

	constructor(private _accountLookupService: AccountLookupService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		this.form = new FormGroup({
			name: new FormControl(this.oracle.name, [
				Validators.required,
				Validators.minLength(3),
			]),
			type: new FormControl(this.oracle.type, Validators.required),
			partyType: new FormControl(this.oracle.partyType, Validators.required),
			endpoint: new FormControl(this.oracle.endpoint),
		});
	}

	selectOracleType($event: Event) {
		if (this.form.controls.type.value === "builtin") {
			this.isBuiltinSelected = true;
		} else {
			this.isBuiltinSelected = false;
		}
	}

	register() {
		this.submitted = true;

		// if (!this.form.valid) {
		//   this.registerError = "Invalid oracle details";
		//   return;
		// }

		if (!this.form.value.name) {
			this._messageService.addError("Invalid name");
			return;
		}

		if (this.form.controls.type.value === "remote-http" && !this.form.controls.endpoint.value) {
			this.form.controls.endpoint.setErrors({invalid: true});
			this._messageService.addError("Invalid endpoint");
			return;
		}


		this._accountLookupService.registerOracle(this.form.value).subscribe(
			(oracle) => {
				if (oracle) {
					this._messageService.addSuccess("Oracle created with success!");
					history.back();
					return;
				}
			},
			(error: Error) => {
				this._messageService.addError(error.message);
			}
		);
	}

	cancel() {
		this.oracle = this._accountLookupService.createEmptyOracle();
		history.back();
	}
}
