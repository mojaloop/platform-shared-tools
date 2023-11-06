import {Component, Directive, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {IBuiltinIamUser} from "../../_services_and_types/security_types";
import {MessageService} from "src/app/_services_and_types/message.service";


@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-users-list.component.html'
})
export class BuiltinIamUsersListComponent implements OnInit, OnDestroy {
	users: BehaviorSubject<IBuiltinIamUser[]> = new BehaviorSubject<IBuiltinIamUser[]>([]);
	usersSubs?: Subscription;

	constructor(private _builtinIamSvc:BuiltinIamService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("BuiltinIamComponent ngOnInit");

		this.search();
	}

	ngOnDestroy() {
		if (this.usersSubs) {
			this.usersSubs.unsubscribe();
		}
	}

	resetFilter(){
		(document.getElementById("filterName") as HTMLInputElement).value = "";
		(document.getElementById("filterEmail") as HTMLInputElement).value = "";
		(document.getElementById("filterUserType") as HTMLInputElement).value = "ALL";
		(document.getElementById("filterUserState") as HTMLInputElement).value = "ALL";

		this.search();
	}

	search(){
		const name = (document.getElementById("filterName") as HTMLInputElement).value;
		const id = (document.getElementById("filterEmail") as HTMLInputElement).value;

		const typeStr = (document.getElementById("filterUserType") as HTMLSelectElement).value;
		const type = typeStr==="ALL" ? undefined : typeStr;

		const stateStr = (document.getElementById("filterUserState") as HTMLSelectElement).value;
		const state = stateStr==="ALL" ? undefined : (stateStr=="true");


		this.usersSubs = this._builtinIamSvc.getAllUsers(type, id, name, state).subscribe((users) => {
			this.users.next(users);
		}, error => {
			this._messageService.addError(error.message || error);
		});
	}
}
