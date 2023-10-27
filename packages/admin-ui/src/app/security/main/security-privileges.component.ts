import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {AllPrivilegesResp} from "src/app/_services_and_types/security_types";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";

@Component({
	selector: 'app-security',
	templateUrl: './security-privileges.component.html'
})
export class SecurityPrivilegesComponent implements OnInit, OnDestroy {
	privileges: BehaviorSubject<AllPrivilegesResp[]> = new BehaviorSubject<AllPrivilegesResp[]>([]);
	privilegesSubs?: Subscription;

	constructor(private _authorizationSvc: AuthorizationService) {
	}

	ngOnInit(): void {
		console.log("SecurityComponent ngOnInit");

		this.privilegesSubs = this._authorizationSvc.getAllPrivileges().subscribe((privs) => {
			console.log("SecurityComponent ngOnInit - got getAllPrivileges");
			this.privileges.next(privs);
		});


	}

	ngOnDestroy() {
		if (this.privilegesSubs) {
			this.privilegesSubs.unsubscribe();
		}

	}
}
