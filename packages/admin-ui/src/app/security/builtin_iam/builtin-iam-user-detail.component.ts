import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {AllPrivilegesResp, IBuiltinIamUser} from "../../_services_and_types/security_types";
import {MessageService} from "../../_services_and_types/message.service";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "../../_services_and_types/authorization.service";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ParticipantFundsMovementDirections} from "@mojaloop/participant-bc-public-types-lib";

export type UserPrivileges = AllPrivilegesResp & {
	fromRoleLabel: string
}

@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-user-detail.component.html'
})
export class BuiltinIamUserDetailComponent implements OnInit, OnDestroy {
	public userId!: string;
	public user: BehaviorSubject<IBuiltinIamUser | null> = new BehaviorSubject<IBuiltinIamUser | null>(null);
	private _userSubs?: Subscription;

	public allRoles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);
	public roles: BehaviorSubject<PlatformRole[]> = new BehaviorSubject<PlatformRole[]>([]);
	public privs: BehaviorSubject<UserPrivileges[]> = new BehaviorSubject<UserPrivileges[]>([]);

	private _alllRolesSubs?: Subscription;
	private _alllPrivsSubs?: Subscription;

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
		if (!id) throw new Error("Invalid id param in user detail");
		this.userId = id;

		console.log(`BuiltinIamUserDetailComponent ngOnInit id: ${id}`);

		this._fetchUser();
	}

	ngOnDestroy() {
		if(this._userSubs) this._userSubs.unsubscribe();
	}

	async copyUserIdToClipboard() {
		await navigator.clipboard.writeText(this.userId || "");
	}

	private _fetchUser(){
		this._userSubs = this._builtinIamSvc.getUserById(this.userId).subscribe(value => {
			this.user.next(value);
			this._fetchRolesAndPrivileges();
		}, error => {
			this.user.next(null);
			console.log(error);
		});
	}

	private _fetchRolesAndPrivileges():void{
		if(!this.user.value) return;

		const rolesList: PlatformRole[] = [];
		const privsList: UserPrivileges[] = [];

		const privIdsList: { id: string, roleLabel: string }[] = [];

		// Major enhancement opportunity below!!!

		this._alllPrivsSubs = this._authorizationService.getAllPrivileges().subscribe((appPrivs: AllPrivilegesResp[]) => {

			this._alllRolesSubs = this._authorizationService.getAllPlatformRoles().subscribe((platformRoles: PlatformRole[]) => {
				this.allRoles.next(platformRoles);

				platformRoles.forEach(role => {
					if (this.user.value?.platformRoles.includes(role.id)) {
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

	enableUser() {
		this._builtinIamSvc.enableUser(this.userId).subscribe(value => {
			this._fetchUser();
			this._messageService.addSuccess("User enabled");
		}, error => {
			this._messageService.addError(`${error || "Could not enable user"}`);
		});
	}

	disableUser() {
		this._builtinIamSvc.disableUser(this.userId).subscribe(value => {
			this._fetchUser();
			this._messageService.addSuccess("User disabled");
		}, error => {
			this._messageService.addError(`${error || "Could not disable user"}`);
		});
	}

	removeRole(roleId: string) {
		this._builtinIamSvc.removeRoleFromUser(this.userId, roleId).subscribe(value => {
			this._fetchUser();
			this._messageService.addSuccess("Role removed successfully");
		}, error => {
			this._messageService.addError(`${error || "Could remove role from user"}`);
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

		this._builtinIamSvc.addRolesToUser(this.userId, selectedRolesIds).subscribe(value => {
			this._fetchUser();
			this._messageService.addSuccess("Role(s) added successfully");
			this.addRolesModalRef!.close();
		}, error => {
			this._messageService.addError(`${error || "Could not role(s) to user"}`);
		});


	}
}
