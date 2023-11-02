import {Injectable, isDevMode} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import { Observable} from "rxjs";
import {AuthenticationService} from "./authentication.service";
import {UnauthorizedError} from "./errors";
import {
	IBuiltinIamApplication,
	IBuiltinIamApplicationCreate,
	IBuiltinIamUser,
	IBuiltinIamUserCreate
} from "./security_types";

const SVC_BASEURL = "/_builtin_iam";

@Injectable({
	providedIn: "root",
})
export class BuiltinIamService {

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {

	}
/*
	static CreateEmptyUser():IBuiltinIamUser{
		return {
			email:"",
			fullName:"",
			userType: "DFSP",
			platformRoles: [],
			participantRoles: []
		};
	}*/

	getAllUsers(type?:string, id?:string, name?:string, enabled?: boolean):Observable<IBuiltinIamUser[]>{
		const searchParams = new URLSearchParams();
		if(type != undefined) searchParams.append("type", type);
		if(id != undefined) searchParams.append("id", id);
		if(name != undefined) searchParams.append("name", name);
		if(enabled != undefined) searchParams.append("enabled", String(enabled));

		return new Observable<IBuiltinIamUser[]>((subscriber) => {
			this._http.get<IBuiltinIamUser[]>(`${SVC_BASEURL}/users?${searchParams.toString()}`).subscribe(
				(result: IBuiltinIamUser[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				(error) => {
					if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else if (error && error.status === 403) {
						console.warn("Access forbidden received on getAllUsers");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getUserById(id:string):Observable<IBuiltinIamUser | null>{
			return new Observable<IBuiltinIamUser | null>((subscriber) => {
				this._http.get<IBuiltinIamUser | null>(SVC_BASEURL + `/users/${id}`).subscribe(
					(result: IBuiltinIamUser | null) => {
						console.log(`got response: ${result}`);

						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn("Access forbidden received on getUsers");
							subscriber.error(new UnauthorizedError(error.error?.msg));
						} else {
							console.error(error);
							subscriber.error(error.error?.msg);
						}

					return subscriber.complete();
				}
			);
		});
	}

	createUser(createUser:IBuiltinIamUserCreate):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + "/users/", createUser)
				.subscribe(value => {
					console.log(`got response - successfully created user: ${createUser.email}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on createUser");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not create user");
					}
					return subscriber.complete();
				});
		});
	}


	enableUser(id:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/users/${id}/enable`, {})
				.subscribe(value => {
					console.log(`got response - successfully enabled user: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on enableUser");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not enable user");
					}
					return subscriber.complete();
				});
		});
	}

	disableUser(id:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/users/${id}/disable`, {})
				.subscribe(value => {
					console.log(`got response - successfully disable user: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on disableUser");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not disable user");
					}
					return subscriber.complete();
				});
		});
	}

	addRolesToUser(id:string, roleIds:string[]):Observable<void>{
		const reqBody = roleIds.map(id => {
			return {roleId: id};
		});

		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/users/${id}/roles/`, reqBody)
				.subscribe(value => {
					console.log(`got response - successfully added role(s) to user: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on addRoleToUser");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not add role to user");
					}
					return subscriber.complete();
				});
		});
	}

	removeRoleFromUser(id:string, roleId:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.delete<void>(SVC_BASEURL + `/users/${id}/roles/${roleId}`)
				.subscribe(value => {
					console.log(`got response - successfully removed role ${roleId} from user: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on removeRoleFromUser");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not remove role from user");
					}
					return subscriber.complete();
				});
		});
	}

	/* applications */

	getAllApps(clientId?: string, canLogin?: boolean, enabled?: boolean):Observable<IBuiltinIamApplication[]>{
		const searchParams = new URLSearchParams();
		if(clientId != undefined) searchParams.append("clientId", clientId);
		if(canLogin != undefined) searchParams.append("canLogin", String(canLogin));
		if(enabled != undefined) searchParams.append("enabled", String(enabled));

		return new Observable<IBuiltinIamApplication[]>((subscriber) => {
			this._http.get<IBuiltinIamApplication[]>(`${SVC_BASEURL}/apps?${searchParams.toString()}`).subscribe(
				(result: IBuiltinIamApplication[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				(error) => {
					if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else if (error && error.status === 403) {
						console.warn("Access forbidden received on getAllApps");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getAppById(id:string):Observable<IBuiltinIamApplication | null>{
		return new Observable<IBuiltinIamApplication | null>((subscriber) => {
			this._http.get<IBuiltinIamApplication | null>(SVC_BASEURL + `/apps/${id}`).subscribe(
				(result: IBuiltinIamApplication | null) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				(error) => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getApps");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	createApp(createApp:IBuiltinIamApplicationCreate):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + "/apps/", createApp)
				.subscribe(value => {
					console.log(`got response - successfully created app: ${createApp.clientId}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on createApp");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not create app");
					}
					return subscriber.complete();
				});
		});
	}


	enableApp(id:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/apps/${id}/enable`, {})
				.subscribe(value => {
					console.log(`got response - successfully enabled app: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on enableApp");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not enable app");
					}
					return subscriber.complete();
				});
		});
	}

	disableApp(id:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/apps/${id}/disable`, {})
				.subscribe(value => {
					console.log(`got response - successfully disable app: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on disableApp");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not disable app");
					}
					return subscriber.complete();
				});
		});
	}

	addRolesToApp(id:string, roleIds:string[]):Observable<void>{
		const reqBody = roleIds.map(id => {
			return {roleId: id};
		});

		return new Observable<void>((subscriber) => {
			this._http.post<void>(SVC_BASEURL + `/apps/${id}/roles/`, reqBody)
				.subscribe(value => {
					console.log(`got response - successfully added role(s) to app: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on addRoleToApp");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not add role to app");
					}
					return subscriber.complete();
				});
		});
	}

	removeRoleFromApp(id:string, roleId:string):Observable<void>{
		return new Observable<void>((subscriber) => {
			this._http.delete<void>(SVC_BASEURL + `/apps/${id}/roles/${roleId}`)
				.subscribe(value => {
					console.log(`got response - successfully removed role ${roleId} from app: ${id}`);

					subscriber.next();
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on removeRoleFromApp");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error.error?.msg || "Could not remove role from app");
					}
					return subscriber.complete();
				});
		});
	}
}
