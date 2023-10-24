import {Injectable, isDevMode} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, EMPTY, Observable, of} from "rxjs";
import jwt_decode from "jwt-decode";
import {Router} from "@angular/router";

const AUTH_N_SVC_BASEURL = "/auth_n";
const CLIENT_ID = "security-bc-ui";

@Injectable({
	providedIn: "root",
})
export class AuthenticationService {
	private _isDevMode: boolean;
	private _accessToken: string | null = null;
	private _username: string | null = null;
	private _platformRoles: string[] = [];
	private _participantRoles: {participantId: string, roleId: string}[] = [];
	private _decodedToken: any = null;
	private _expiresAt: number = 0;

	public redirectUrl: string | null = null;

	public LoggedInObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public UsernameObs: BehaviorSubject<string> = new BehaviorSubject<string>("");

	constructor(private _settings: SettingsService, private _http: HttpClient, private _router: Router) {
		this._isDevMode = _settings.isDevMode;
		if (!_settings.accessToken) return;

		this._accessToken = _settings.accessToken;
		this._loadAccessToken(this._accessToken);
	}

	// can be used from the AuthInterceptor to determine if the response if from login post
	public get loginPostUrl():string{
		return AUTH_N_SVC_BASEURL + "/token";
	}

	public get platformRoles(): string[] {
		return this._platformRoles;
	}

	public get participantRoles(): {participantId: string, roleId: string}[] {
		return this._participantRoles;
	}

	public get username(): string | null {
		return this._username;
	}

	public get accessToken(): string | null {
		return this._accessToken;
	}

	public get decodedToken(): any | null {
		return this._decodedToken;
	}

	private _loadAccessToken(accessToken: string): boolean {
		try{
			const decoded:any = jwt_decode(accessToken);

			if (!decoded) {
				console.warn("invalid token, could not decode it");
				return false;
			}

			if (!decoded.sub) {
				console.warn("invalid token, sub property is missing");
				return false;
			}

			const subSplit = decoded.sub.split("::");
			const subjectType = subSplit[0];
			const subject = subSplit[1];

			if (!subjectType.toUpperCase().startsWith("USER")) {
				console.warn("invalid token, was expecting a user token");
				return false;
			}

			this._accessToken = accessToken;
			this._username = subject;
			this._platformRoles = decoded.platformRoles;
			this._participantRoles = decoded.participantRoles;
			this._decodedToken = decoded;
			this._expiresAt = decoded.exp * 1000;

			if(Date.now() > this._expiresAt) {
				console.warn("expired token");
				return false;
			}

			this.LoggedInObs.next(true);
			this.UsernameObs.next(this._username!);

			return true;
		} catch (Error) {
			console.warn("Failed loading access token");
			return false;
		}

	}

	login(username: string, password: string): Observable<boolean> {
		return new Observable<boolean>(subscriber => {
			this._cleanTokenState();
			this.LoggedInObs.next(false);
			this.UsernameObs.next("");

			const body = {
				grant_type: "password",
				client_id: CLIENT_ID,
				username: username,
				password: password
			};

			function fail() {
				subscriber.next(false);
				return subscriber.complete();
			}

			this._http.post<TokenEndpointResponse>(this.loginPostUrl, body).subscribe(
				(result: TokenEndpointResponse) => {
					console.log("got token response from Login");

					try{
						if(!this._loadAccessToken(result.access_token)) return fail();
					}catch(e:any){
						return fail();
					}

					this._settings.accessToken = this._accessToken;
					this._settings.username = this._username;
					this._settings.save();

					this.LoggedInObs.next(true);
					subscriber.next(true);
					return subscriber.complete();
				}, error => {
					return fail();
				}
			);
		});


		/*
			let observable: Observable<any> = this._http.post<TokenEndpointResponse>(AUTH_N_SVC_BASEURL+"/token", body).pipe(
			  shareReplay(),
			  tap((resp:TokenEndpointResponse)=>{
				console.log(`got token response: ${resp}`);

				if(!this._loadAccessToken(resp.access_token)){
				  return of(false);
				}

				this._settings.accessToken = this._accessToken;
				this._settings.username = this._username;
				this._settings.save();

				return of(true);
			  }),

			  catchError(err => {

				return of(false);
			  })
			);

			return observable;*/
	}

	isLoggedIn(): boolean {
		if (!this._decodedToken)
			return false;

		if (this._expiresAt > Date.now())
			return true;

		return false;
	}

	private _cleanTokenState(){
		this._accessToken = null;
		this._settings.clearToken();
	}

	logout() {
		this._cleanTokenState();

		this.LoggedInObs.next(false);
		this.UsernameObs.next("");
	}
}
