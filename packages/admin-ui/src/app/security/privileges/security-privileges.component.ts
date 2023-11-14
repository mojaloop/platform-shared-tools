import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {PrivilegeWithOwnerAppInfo} from "src/app/_services_and_types/security_types";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {UnauthorizedError} from "../../_services_and_types/errors";
import {MessageService} from "../../_services_and_types/message.service";

@Component({
	selector: 'app-security',
	templateUrl: './security-privileges.component.html'
})
export class SecurityPrivilegesComponent implements OnInit, OnDestroy {
	privileges: BehaviorSubject<PrivilegeWithOwnerAppInfo[]> = new BehaviorSubject<PrivilegeWithOwnerAppInfo[]>([]);
	privilegesSubs?: Subscription;

	constructor(private _authorizationSvc: AuthorizationService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("SecurityComponent ngOnInit");

		this.privilegesSubs = this._authorizationSvc.getAllPrivileges().subscribe((privs) => {
			console.log("SecurityComponent ngOnInit - got getAllPrivileges");
			this.privileges.next(privs);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});


	}

	ngOnDestroy() {
		if (this.privilegesSubs) {
			this.privilegesSubs.unsubscribe();
		}

	}
}
