import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {PrivilegeWithOwnerAppInfo} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {UnauthorizedError} from "./errors";

const AUTH_Z_SVC_BASEURL = "/auth_z";

@Injectable({
	providedIn: "root",
})
export class AuthorizationService {

	constructor(private _settings: SettingsService, private _http: HttpClient) {

	}

	getAllPrivileges(): Observable<PrivilegeWithOwnerAppInfo[]> {
		return new Observable<PrivilegeWithOwnerAppInfo[]>(subscriber => {
			this._http.get<PrivilegeWithOwnerAppInfo[]>(AUTH_Z_SVC_BASEURL + "/appPrivileges").subscribe(
				(result: PrivilegeWithOwnerAppInfo[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					console.error(error);
					subscriber.next([]);
					return subscriber.complete();
				}
			);
		});
	}

	getAllPlatformRoles(): Observable<PlatformRole[]> {
		return new Observable<PlatformRole[]>(subscriber => {
			this._http.get<PlatformRole[]>(AUTH_Z_SVC_BASEURL + "/platformRoles").subscribe(
				(result: PlatformRole[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					console.error(error);
					subscriber.next([]);
					return subscriber.complete();
				}
			);
		});
	}

	createRole(newRole:PlatformRole):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(AUTH_Z_SVC_BASEURL + "/platformRoles/", newRole)
				.subscribe(value => {
					console.log(`got response - successfully created role: ${newRole.id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on createRole");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not create role");
					}
					return subscriber.complete();
				});
		});
	}

	addPrivilegesToRole(roleId:string, privilegeIds:string[]):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(`${AUTH_Z_SVC_BASEURL}/platformRoles/${roleId}/add_privileges`, privilegeIds)
				.subscribe(value => {
					console.log(`got response - successfully added privileges to role: ${roleId}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on addPrivilegesToRole");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not addPrivilegesToRole");
					}
					return subscriber.complete();
				});
		});
	}

	removePrivilegesFromRole(roleId:string, privilegeIds:string[]):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(`${AUTH_Z_SVC_BASEURL}/platformRoles/${roleId}/remove_privileges`, privilegeIds)
				.subscribe(value => {
					console.log(`got response - successfully removed privileges from role: ${roleId}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on removePrivilegesFromRole");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not removePrivilegesFromRole");
					}
					return subscriber.complete();
				});
		});
	}
}
