import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole, Privilege} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {AllPrivilegesResp} from "../../_services_and_types/security_types";

@Component({
	selector: 'app-platform-role-detail',
	templateUrl: './platform-role-detail.component.html'
})
export class PlatformRoleDetailComponent implements OnInit {
	private readonly _roleId: string | null;
	public role: BehaviorSubject<PlatformRole | null> = new BehaviorSubject<PlatformRole | null>(null);
	public includedPrivileges: BehaviorSubject<AllPrivilegesResp[]> = new BehaviorSubject<AllPrivilegesResp[]>([]);
	public excludedPrivileges: BehaviorSubject<AllPrivilegesResp[]> = new BehaviorSubject<AllPrivilegesResp[]>([]);

	constructor(private _authorizationSvc: AuthorizationService, private route: ActivatedRoute) {
		this._roleId = this.route.snapshot.paramMap.get("id");
	}

	ngOnInit(): void {
		this._authorizationSvc.getAllPlatformRoles().subscribe((roles) => {
			console.log("SecurityComponent ngOnInit - got getAllPlatformRoles");
			const role: PlatformRole | undefined = roles.find(value => value.id == this._roleId);

			this.role.next(role || null);
			if(!role) return;

			const rolePrivs: AllPrivilegesResp[] = [];

			this._authorizationSvc.getAllPrivileges().subscribe((privsList: AllPrivilegesResp[]) => {
				if(!privsList || privsList.length<=0) {
					this.includedPrivileges.next([]);
					this.excludedPrivileges.next([]);
					return;
				}

				const included:AllPrivilegesResp[] = [];
				const excluded:AllPrivilegesResp[] = [];

				privsList.forEach(priv => {
					if(role.privileges.includes(priv.id)){
						included.push(priv);
					}else{
						excluded.push(priv);
					}
				});

				this.includedPrivileges.next(included);
				this.excludedPrivileges.next(excluded);
			});
		});
	}

	async copyIdToClipboard() {
		await navigator.clipboard.writeText(this._roleId || "");
	}

	showAddPrivilegesModal() {

	}
}
