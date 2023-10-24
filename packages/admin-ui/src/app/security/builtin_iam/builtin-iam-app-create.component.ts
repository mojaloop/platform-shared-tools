import {Component, OnDestroy, OnInit} from "@angular/core";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {IBuiltinIamApplication, IBuiltinIamApplicationCreate} from "../../_services_and_types/security_types";
import { FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {MessageService} from "../../_services_and_types/message.service";
import {BOOL_TYPE} from "@angular/compiler/src/output/output_ast";
import {Router} from "@angular/router";

@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-app-create.component.html'
})
export class BuiltinIamAppCreateComponent implements OnInit, OnDestroy {
	public form!: FormGroup;

	public submitted: boolean = false;

	constructor(private _builtinIamSvc: BuiltinIamService, private _messageService: MessageService, private _router: Router) {

	}

	ngOnInit(): void {
		console.log("BuiltinIamAppCreateComponent ngOnInit");
		this.form = new FormGroup({
			"clientId": new FormControl(undefined, [Validators.required]),
			"appCanLoginType": new FormControl(true, [Validators.required]),
			"clientSecret": new FormControl(undefined, [Validators.required]),
			"confirmSecret": new FormControl(undefined, [Validators.required]),
		});
		this.form.addValidators(this._textMatchValidator("clientSecret", "confirmSecret"));
	}

	ngOnDestroy() { }

	_textMatchValidator(controlName: string, matchingControlName: string):ValidatorFn {
		return () => {
			const control = this.form.get(controlName);
			const matchingControl = this.form.get(matchingControlName);

			if (matchingControl!.errors && !matchingControl!.errors?.["confirmedValidator"]) {
				return null;
			}

			if (control!.value !== matchingControl!.value) {
				const error = { confirmedValidator: 'client secrets do not match.' };
				matchingControl!.setErrors(error);
				return error;
			} else {
				matchingControl!.setErrors(null);
				return null;
			}
		};
	}

	appCanLoginTypeChanged(event: Event) {
		const appCanLoginTypeElem = document.getElementById("appCanLoginType") as HTMLSelectElement;
		const appCanLogin = appCanLoginTypeElem.value === 'true';

		if(appCanLogin){
			this.form.controls["clientSecret"].enable();
			this.form.controls["confirmSecret"].enable();
		}else{
			this.form.controls["clientSecret"].disable();
			this.form.controls["confirmSecret"].disable();
		}
	}

	async createApp() {
		this.submitted = true;

		// TODO disable buttons

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid App");
			return;
		}

		const clientSecret = this.form.controls["clientSecret"].value;
		const confirmClientSecret = this.form.controls["confirmSecret"].value;

		if(clientSecret !== confirmClientSecret){
			this._messageService.addError("Please provide matching client secrets");
			return;
		}

		const appCanLoginTypeElem = document.getElementById("appCanLoginType") as HTMLSelectElement;
		const appCanLogin = appCanLoginTypeElem.value === 'true';

		const appCreate:IBuiltinIamApplicationCreate = {
			enabled: true,
			clientId: this.form.controls["clientId"].value,
			platformRoles: [],
			clientSecret: null,
			canLogin: false
		};

		if(appCanLogin){
			appCreate.clientSecret = clientSecret;
			appCreate.canLogin = true;
		}

		// TODO enable buttons after response
		this._builtinIamSvc.createApp(appCreate).subscribe(value => {
			this._messageService.addSuccess("App Created");
			this._router.navigateByUrl(`security/builtin_iam/apps/${appCreate.clientId}`);
		}, errorMsg => {
			this._messageService.addError("Error creating app: "+errorMsg||"unknown");
		});

	}

	cancel() {
		history.back();
	}

	showHidePassword() {
		const passElem: HTMLInputElement | null = document.getElementById("clientSecret") as HTMLInputElement | null;
		const pass2Elem: HTMLInputElement | null = document.getElementById("confirmSecret") as HTMLInputElement | null;
		if(!passElem || !pass2Elem) return;

		const passElemIcon: HTMLElement | null = document.getElementById("password-icon");
		const pass2ElemIcon: HTMLElement | null = document.getElementById("confirmPassword-icon");

		if (passElem.getAttribute("type") === "text"){
			passElem.setAttribute("type", "password");
			pass2Elem.setAttribute("type", "password");
			if(passElemIcon) passElemIcon.classList.replace("bi-eye", "bi-eye-slash");
			if(pass2ElemIcon) pass2ElemIcon.classList.replace("bi-eye", "bi-eye-slash");
		}else if(passElem.getAttribute("type") === "password"){
			passElem.setAttribute("type", "text");
			pass2Elem.setAttribute("type", "text");
			if(passElemIcon) passElemIcon.classList.replace("bi-eye-slash", "bi-eye");
			if(pass2ElemIcon) pass2ElemIcon.classList.replace("bi-eye-slash", "bi-eye");
		}

	}
}
