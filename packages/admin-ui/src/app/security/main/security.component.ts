import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {AllPrivilegesResp} from "src/app/_services_and_types/security_types";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";

@Component({
	selector: 'app-security',
	templateUrl: './security.component.html',
	styleUrls: ['./security.component.css']
})
export class SecurityComponent implements OnInit, OnDestroy {
	privileges: BehaviorSubject<AllPrivilegesResp[]> = new BehaviorSubject<AllPrivilegesResp[]>([]);
	privilegesSubs?: Subscription;

	roles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);
	rolesSubs?: Subscription;

	constructor(private _authorizationSvc: AuthorizationService) {
	}

	ngOnInit(): void {
		console.log("SecurityComponent ngOnInit");

		this.privilegesSubs = this._authorizationSvc.getAllPrivileges().subscribe((privs) => {
			console.log("SecurityComponent ngOnInit - got getAllPrivileges");
			this.privileges.next(privs);
		});

		this.rolesSubs = this._authorizationSvc.getAllPlatformRoles().subscribe((roles) => {
			console.log("SecurityComponent ngOnInit - got getAllPlatformRoles");
			this.roles.next(roles);
		});
	}

	ngOnDestroy() {
		if (this.privilegesSubs) {
			this.privilegesSubs.unsubscribe();
		}

		if (this.rolesSubs) {
			this.rolesSubs.unsubscribe();
		}
	}
}
