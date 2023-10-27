import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {PlatformRole, Privilege} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {AllPrivilegesResp, IBuiltinIamApplicationCreate} from "../../_services_and_types/security_types";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "../../_services_and_types/message.service";

@Component({
	selector: 'app-platform-role-detail',
	templateUrl: './platform-role-create.component.html'
})
export class PlatformRoleCreateComponent implements OnInit {
	public form!: FormGroup;
	public submitted: boolean = false;

	constructor(private _authorizationSvc: AuthorizationService, private _messageService: MessageService, private _router: Router) {

	}

	ngOnInit(): void {
		this.form = new FormGroup({
			"id": new FormControl(undefined, [Validators.required]),
			"isApplicationRole": new FormControl(false, [Validators.required]),
			"labelName": new FormControl(undefined, [Validators.required]),
			"description": new FormControl(undefined, [Validators.required]),
			"isPerParticipantRole": new FormControl(false, [Validators.required]),
		});
	}

	async createApp() {
		this.submitted = true;

		// TODO disable buttons

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid Role");
			return;
		}

		const newRole:PlatformRole = {
			id: this.form.controls["id"].value,
			labelName: this.form.controls["labelName"].value,
			description: this.form.controls["description"].value,
			isApplicationRole: this.form.controls["isApplicationRole"].value,
			isPerParticipantRole: this.form.controls["isPerParticipantRole"].value,
			isExternal: false,
			externalId: undefined,
			privileges: []
		};

		// TODO enable buttons after response
		this._authorizationSvc.createRole(newRole).subscribe(value => {
			this._messageService.addSuccess("Role Created");
			this._router.navigateByUrl(`security/builtin_iam/roles/${newRole.id}`);
		}, errorMsg => {
			this._messageService.addError("Error creating role: "+errorMsg||"unknown");
		});

	}

	cancel() {
		history.back();
	}

	isApplicationRoleChanged($event: Event) {
		const isApplicationRoleElem = document.getElementById("isApplicationRole") as HTMLSelectElement;
		const isApplicationRole = isApplicationRoleElem.value === "true";

		if(isApplicationRole){
			this.form.controls["isPerParticipantRole"].setValue(false);
			this.form.controls["isPerParticipantRole"].disable();
		}else{
			this.form.controls["isPerParticipantRole"].enable();
		}
	}
}
