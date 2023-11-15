import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole, Privilege} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {PrivilegeWithOwnerAppInfo} from "../../_services_and_types/security_types";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {MessageService} from "src/app/_services_and_types/message.service";

@Component({
	selector: 'app-platform-role-detail',
	templateUrl: './platform-role-detail.component.html'
})
export class PlatformRoleDetailComponent implements OnInit {
	readonly ALL_STR_ID = "(All)";
	private readonly _roleId: string | null;
	public role: BehaviorSubject<PlatformRole | null> = new BehaviorSubject<PlatformRole | null>(null);
	public includedPrivileges: BehaviorSubject<PrivilegeWithOwnerAppInfo[]> = new BehaviorSubject<PrivilegeWithOwnerAppInfo[]>([]);
	public excludedPrivileges: BehaviorSubject<PrivilegeWithOwnerAppInfo[]> = new BehaviorSubject<PrivilegeWithOwnerAppInfo[]>([]);

	public boundedContextNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	public applicationNames: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

	@ViewChild("addPrivilegesModal") // Get a reference to the addRolesModal
	addPrivilegesModal!: NgbModal;
	addPrivilegesModalRef?: NgbModalRef;

	curPrivsSelPrefix = "curPrivs_";
	curPrivsSelectedIds: string[] = [];

	addPrivsSelPrefix = "addPrivs_";
	addPrivsSelectedIds: string[] = [];

	privs: PrivilegeWithOwnerAppInfo[] = [];

	constructor(
		private _authorizationSvc: AuthorizationService,
		private route: ActivatedRoute,
		private _modalService: NgbModal,
		private _messageService: MessageService,
	) {
		this._roleId = this.route.snapshot.paramMap.get("id");
		if (!this._roleId) throw new Error("Invalid id param in role detail");
	}

	ngOnInit(): void {
		this._fetchRole();
	}

	private _fetchRole(){
		this._authorizationSvc.getAllPlatformRoles().subscribe((roles) => {
			console.log("SecurityComponent ngOnInit - got getAllPlatformRoles");
			const role: PlatformRole | undefined = roles.find(value => value.id == this._roleId);

			this.role.next(role || null);
			if(!role) return;

			this._fetchPrivileges(role);
		});
	}

	private _fetchPrivileges(role:PlatformRole){
		this._authorizationSvc.getAllPrivileges().subscribe((privsList: PrivilegeWithOwnerAppInfo[]) => {
			if(!privsList || privsList.length<=0) {
				this.includedPrivileges.next([]);
				this.excludedPrivileges.next([]);
				this.boundedContextNames.next([]);
				this.applicationNames.next([]);
				return;
			}

			this.privs = privsList;
			this._filterPrivs();
		});
	}

	private _filterPrivs(){
		const role = this.role.getValue();
		if(!role) return;

		let included:PrivilegeWithOwnerAppInfo[] = [];
		let excluded:PrivilegeWithOwnerAppInfo[] = [];

		const boundedContexts:string[] = [];
		const applications:string[] = [];

		this.privs.forEach(priv => {
			if(role.privileges.includes(priv.id)){
				included.push(priv);
			}else{
				excluded.push(priv);
			}

			if(!boundedContexts.includes(priv.boundedContextName)) boundedContexts.push(priv.boundedContextName);
			if(!applications.includes(priv.applicationName)) applications.push(priv.applicationName);
		});

		// filter out included
		const filterCurrentBcNamesStr = (document.getElementById("filterIncludedBcNames") as HTMLSelectElement)?.value || this.ALL_STR_ID;
		const filterCurrentAppNamesStr = (document.getElementById("filterIncludedAppNames") as HTMLSelectElement)?.value || this.ALL_STR_ID;
		if(filterCurrentBcNamesStr !== this.ALL_STR_ID || filterCurrentAppNamesStr !== this.ALL_STR_ID){
			included = included.filter(item =>
				(filterCurrentBcNamesStr===this.ALL_STR_ID || item.boundedContextName===filterCurrentBcNamesStr) &&
				(filterCurrentAppNamesStr===this.ALL_STR_ID || item.applicationName===filterCurrentAppNamesStr)
			);
		}
		// filter out excluded (these might not exist in the DOM, need a nullable with default
		const filterExcludedBcNamesStr = (document.getElementById("filterExcludedBcNames") as HTMLSelectElement)?.value || this.ALL_STR_ID;
		const filterExcludedAppNamesStr = (document.getElementById("filterExcludedAppNames") as HTMLSelectElement)?.value || this.ALL_STR_ID;
		if(filterExcludedBcNamesStr !== this.ALL_STR_ID || filterExcludedAppNamesStr !== this.ALL_STR_ID){
			excluded = excluded.filter(item =>
				(filterExcludedBcNamesStr===this.ALL_STR_ID || item.boundedContextName===filterExcludedBcNamesStr) &&
				(filterExcludedAppNamesStr===this.ALL_STR_ID || item.applicationName===filterExcludedAppNamesStr)
			);
		}

		// Sort alphabetically
		included.sort((a,b)=>
			a.boundedContextName.localeCompare(b.boundedContextName) ||
			a.applicationName.localeCompare(b.applicationName) ||
			a.id.localeCompare(b.id)
		);

		excluded.sort((a,b)=>
			a.boundedContextName.localeCompare(b.boundedContextName) ||
			a.applicationName.localeCompare(b.applicationName) ||
			a.id.localeCompare(b.id)
		);

		boundedContexts.sort((a,b)=>a.localeCompare(b));
		applications.sort((a,b)=>a.localeCompare(b));

		this.includedPrivileges.next(included);
		this.excludedPrivileges.next(excluded);
		this.boundedContextNames.next(boundedContexts);
		this.applicationNames.next(applications);
	}

	async copyIdToClipboard() {
		await navigator.clipboard.writeText(this._roleId || "");
	}

	showAddPrivilegesModal() {
		this.addPrivilegesModalRef = this._modalService.open(
			this.addPrivilegesModal,
			{ centered: true }
		);
	}

	/*addPrivileges(){
		if (!this.addPrivilegesModalRef) return;

		const selectedPrivsIdsElem: HTMLSelectElement = document.getElementById(
			"addPrivileges_PrivsIds"
		) as HTMLSelectElement;

		const selectedPrivsIds = Array.from(selectedPrivsIdsElem.selectedOptions, option => option.value);

		if(selectedPrivsIds.length<=0){
			selectedPrivsIdsElem.classList.add("is-invalid");
			return;
		}else{
			selectedPrivsIdsElem.classList.remove("is-invalid");
		}

		this._authorizationSvc.addPrivilegesToRole(this._roleId!, selectedPrivsIds).subscribe(value => {
			this._fetchRole();
			this._messageService.addSuccess("Role privilege(s) added successfully");
			this.addPrivilegesModalRef!.close();
		}, error => {
			this._messageService.addError(`${error || "Could not role(s) to user"}`);
		});
	}*/

	addPrivileges(){
		this._authorizationSvc.addPrivilegesToRole(this._roleId!, this.addPrivsSelectedIds).subscribe(value => {
			this.addPrivsSelectedIds = [];
			this._fetchRole();
			this._messageService.addSuccess("Role privilege(s) added successfully");
			// this.addPrivilegesModalRef!.close();
		}, error => {
			this._messageService.addError(`${error || "Could not add privileges to role"}`);
		});
	}

	removePrivileges() {
		this._authorizationSvc.removePrivilegesFromRole(this._roleId!, this.curPrivsSelectedIds).subscribe(value => {
			this.curPrivsSelectedIds = [];
			this._fetchRole();
			this._messageService.addSuccess("Role privilege(s) removed successfully");
			// this.addPrivilegesModalRef!.close();
		}, error => {
			this._messageService.addError(`${error || "Could not remove privileges from role"}`);
		});
	}

	currentPrivsSelChanged(event: any) {
		const privId: string = (event.target.id as string).replace(this.curPrivsSelPrefix, "");

		if (event.target.checked) {
			if (!this.curPrivsSelectedIds.includes(privId))
				this.curPrivsSelectedIds.push(privId);
		} else {
			if (this.curPrivsSelectedIds.includes(privId))
				this.curPrivsSelectedIds = this.curPrivsSelectedIds.filter(item => item != privId);
		}
	}

	addPrivsSelChanged(event: any) {
		const privId: string = (event.target.id as string).replace(this.addPrivsSelPrefix, "");

		if (event.target.checked) {
			if (!this.addPrivsSelectedIds.includes(privId))
				this.addPrivsSelectedIds.push(privId);
		} else {
			if (this.addPrivsSelectedIds.includes(privId))
				this.addPrivsSelectedIds = this.addPrivsSelectedIds.filter(item => item != privId);
		}
	}

	filterChanged() {
		this._filterPrivs();
	}

}
