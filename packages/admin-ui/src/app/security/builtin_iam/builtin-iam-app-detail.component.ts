import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {AllPrivilegesResp, IBuiltinIamApplication} from "../../_services_and_types/security_types";
import {MessageService} from "../../_services_and_types/message.service";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "../../_services_and_types/authorization.service";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";


export type AppPrivileges = AllPrivilegesResp & {
	fromRoleLabel: string
}

@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-app-detail.component.html'
})
export class BuiltinIamAppDetailComponent implements OnInit, OnDestroy {
	public appId!: string;
	public app: BehaviorSubject<IBuiltinIamApplication | null> = new BehaviorSubject<IBuiltinIamApplication | null>(null);
	private _appSubs?: Subscription;

	public allRoles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);
	public roles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);
	public privs: BehaviorSubject<AppPrivileges[]> = new BehaviorSubject<AppPrivileges[]>([]);

	private _allRolesSubs?: Subscription;
	private _allPrivsSubs?: Subscription;

	@ViewChild("addRolesModal") // Get a reference to the addRolesModal
	addRolesModal!: NgbModal;
	addRolesModalRef?: NgbModalRef;

	constructor(
		private _builtinIamSvc: BuiltinIamService,
		private _messageService: MessageService,
		private _route: ActivatedRoute,
		private _authorizationService:AuthorizationService,
		private _modalService: NgbModal
	) { }

	ngOnInit(): void {
		const id = this._route.snapshot.paramMap.get("id");
		if (!id) throw new Error("Invalid id param in app detail");
		this.appId = id;

		console.log(`BuiltinIamAppDetailComponent ngOnInit id: ${id}`);

		this._fetchApp();
	}

	ngOnDestroy() {
		if(this._appSubs) this._appSubs.unsubscribe();
	}

	async copyAppIdToClipboard() {
		await navigator.clipboard.writeText(this.appId || "");
	}

	private _fetchApp(){
		this._appSubs = this._builtinIamSvc.getAppById(this.appId).subscribe(value => {
			this.app.next(value);
			this._fetchRolesAndPrivileges();
		}, error => {
			this.app.next(null);
			console.log(error);
		});
	}

	private _fetchRolesAndPrivileges():void{
		if(!this.app.value) return;

		const rolesList: PlatformRole[] = [];
		const privsList: AppPrivileges[] = [];

		const privIdsList: { id: string, roleLabel: string }[] = [];

		// Major enhancement opportunity below!!!

		this._allPrivsSubs = this._authorizationService.getAllPrivileges().subscribe((appPrivs: AllPrivilegesResp[]) => {

			this._allRolesSubs = this._authorizationService.getAllPlatformRoles().subscribe((platformRoles: PlatformRole[]) => {
				this.allRoles.next(platformRoles);

				platformRoles.forEach(role => {
					if (this.app.value?.platformRoles.includes(role.id)) {
						rolesList.push(role);

						role.privileges.forEach(privId => {
							const exists = privIdsList.find(item => item.id === privId && item.roleLabel === role.labelName);
							if (!exists) privIdsList.push({
								id: privId,
								roleLabel: role.labelName
							});
						});
					}
				});

				privIdsList.forEach(item => {
					const foundAppPriv: AllPrivilegesResp | undefined = appPrivs.find(appPriv => appPriv.id === item.id);
					if (foundAppPriv) {
						privsList.push({
							...foundAppPriv,
							fromRoleLabel: item.roleLabel
						});
					}
				});

				this.roles.next(rolesList);
				this.privs.next(privsList);
			});
		});
	}

	enableApp() {
		this._builtinIamSvc.enableApp(this.appId).subscribe(value => {
			this._fetchApp();
			this._messageService.addSuccess("App enabled");
		}, error => {
			this._messageService.addError(`${error || "Could not enable app"}`);
		});
	}

	disableApp() {
		this._builtinIamSvc.disableApp(this.appId).subscribe(value => {
			this._fetchApp();
			this._messageService.addSuccess("App disabled");
		}, error => {
			this._messageService.addError(`${error || "Could not disable app"}`);
		});
	}

	removeRole(roleId: string) {
		this._builtinIamSvc.removeRoleFromApp(this.appId, roleId).subscribe(value => {
			this._fetchApp();
			this._messageService.addSuccess("Role removed successfully");
		}, error => {
			this._messageService.addError(`${error || "Could remove role from app"}`);
		});
	}

	showAddRolesModal() {
		this.addRolesModalRef = this._modalService.open(
			this.addRolesModal,
			{ centered: true }
		);
	}

	addRoles(e: Event){
		if (!this.addRolesModalRef) return;

		const selectedRolesIdsElem: HTMLSelectElement = document.getElementById(
			"addRoles_RolesIds"
		) as HTMLSelectElement;

		const selectedRolesIds = Array.from(selectedRolesIdsElem.selectedOptions, option => option.value);

		if(selectedRolesIds.length<=0){
			selectedRolesIdsElem.classList.add("is-invalid");
			return;
		}else{
			selectedRolesIdsElem.classList.remove("is-invalid");
		}

		this._builtinIamSvc.addRolesToApp(this.appId, selectedRolesIds).subscribe(value => {
			this._fetchApp();
			this._messageService.addSuccess("Role(s) added successfully");
			this.addRolesModalRef!.close();
		}, error => {
			this._messageService.addError(`${error || "Could not role(s) to app"}`);
		});


	}
}
