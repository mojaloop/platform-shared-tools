import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {IBuiltinIamUser, IBuiltinIamUserCreate} from "../../_services_and_types/security_types";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {MessageService} from "../../_services_and_types/message.service";
import {Router} from "@angular/router";

@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-user-create.component.html'
})
export class BuiltinIamUserCreateComponent implements OnInit, OnDestroy {
	public form!: FormGroup;
	//public user: IBuiltinIamUserCreate = BuiltinIamService.CreateEmptyUser() as IBuiltinIamUserCreate;

	public submitted: boolean = false;

	constructor(private _builtinIamSvc: BuiltinIamService, private _messageService: MessageService, private _router: Router) {

	}

	ngOnInit(): void {
		console.log("BuiltinIamUserCreateComponent ngOnInit");
		this.form = new FormGroup({
			"email": new FormControl(undefined, [Validators.required, Validators.email]),
			"fullName": new FormControl(undefined, [Validators.required]),
			"userType": new FormControl("HUB", [Validators.required]),
			"password": new FormControl(undefined, [Validators.required]),
			"confirmPassword": new FormControl(undefined, [Validators.required]),
		});
		this.form.addValidators(this._textMatchValidator("password", "confirmPassword"));
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	ngOnDestroy() { }

	_textMatchValidator(controlName: string, matchingControlName: string):ValidatorFn {
		return () => {
			const control = this.form.get(controlName);
			const matchingControl = this.form.get(matchingControlName);

			if (matchingControl!.errors && !matchingControl!.errors?.["confirmedValidator"]) {
				return null;
			}

			if (control!.value !== matchingControl!.value) {
				const error = { confirmedValidator: 'Passwords do not match.' };
				matchingControl!.setErrors(error);
				return error;
			} else {
				matchingControl!.setErrors(null);
				return null;
			}
		};
	}

	async createUser() {
		this.submitted = true;

		// TODO disable buttons

		if (!this.form.valid) {
			console.table(this.form.value);
			this._messageService.addError("Invalid User");
			return;
		}

		const password = this.form.controls["password"].value;
		const confirmPassword = this.form.controls["confirmPassword"].value;

		if(password !== confirmPassword){
			this._messageService.addError("Please provide matching passwords");
			return;
		}

		//TODO validate the rest of the input

		const userCreate:IBuiltinIamUserCreate = {
			enabled: true,
			userType: this.form.controls["userType"].value,
			email: this.form.controls["email"].value,
			fullName: this.form.controls["fullName"].value,
			password: password,
			platformRoles: [],
			participantRoles: []
		};

		// TODO enable buttons after response
		this._builtinIamSvc.createUser(userCreate).subscribe(value => {
			this._messageService.addSuccess("User Created");
			this._router.navigateByUrl(`security/builtin_iam/users/${userCreate.email}`);
		}, errorMsg => {
			this._messageService.addError("Error creating user: "+errorMsg||"unknown");
		});

	}

	cancel() {
		history.back();
	}

	showHidePassword() {
		const passElem: HTMLInputElement | null = document.getElementById("password") as HTMLInputElement | null;
		const pass2Elem: HTMLInputElement | null = document.getElementById("confirmPassword") as HTMLInputElement | null;
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
