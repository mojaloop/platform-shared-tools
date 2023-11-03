import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";

@Component({
	selector: 'app-platform-role-detail',
	templateUrl: './platform-role-list.component.html'
})
export class PlatformRoleListComponent implements OnInit {
	public roles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);


	constructor(private _authorizationSvc: AuthorizationService, private route: ActivatedRoute) {

	}

	ngOnInit(): void {
		this._authorizationSvc.getAllPlatformRoles().subscribe((roles) => {
			console.log("SecurityComponent ngOnInit - got getAllPlatformRoles");

			this.roles.next(roles);
		});
	}

}
