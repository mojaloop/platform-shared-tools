import {Injectable, isDevMode} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, EMPTY, Observable, of} from "rxjs";
import {catchError, map, shareReplay, tap} from "rxjs/operators";
import jwt_decode from "jwt-decode";
import * as moment from "moment";
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
  private _rolesIds: string[] = [];
  private _decodedToken:any = null;
  private _expiresAt: number = 0;

  public redirectUrl: string | null = null;

  public LoggedInObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public UsernameObs: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(private _settings:SettingsService, private _http: HttpClient, private _router: Router) {
    this._isDevMode = _settings.isDevMode;
    this._accessToken = _settings.accessToken;

    if(!this._accessToken) return;

    this._loadAccessToken(this._accessToken);
  }

  public get rolesIds(): string[]{
      return this._rolesIds;
  }

  public get username(): string| null{
    return this._username ;
  }

  public get accessToken(): string | null{
    return this._accessToken;
  }

  public get decodedToken(): any | null{
    return this._decodedToken;
  }

  private _loadAccessToken(accessToken:string):boolean{
    let decoded:any;
    try {
      decoded = jwt_decode(accessToken);
    } catch(Error) {
      console.warn("Failed to decode jwt");
      return false;
    }

    if(!decoded){
      return false;
    }
    console.log(`decoded: ${decoded}`);

    if(!decoded.sub ){
      return false;
    }

    const subSplit = decoded.sub.split("::");
    const subjectType = subSplit[0];
    const subject = subSplit[1];

    if(!subjectType.toUpperCase().startsWith("USER")){
      console.warn("invalid token, was expecting a user token")
      return false;
    }

    this._accessToken = accessToken;
    this._username = subject;
    this._rolesIds = decoded.roles;
    this._decodedToken = decoded;
    // this._expiresAt = moment().add(resp.expires_in,"second").valueOf();
    this._expiresAt = decoded.exp * 1000;

    this.LoggedInObs.next(true);
    this.UsernameObs.next(this._username!);

    return true;
  }

  login(username:string, password:string):Observable<boolean>{
    const body = {
      grant_type: "password",
      client_id: CLIENT_ID,
      username: username,
      password: password
    };

    return new Observable<boolean>(subscriber => {
      this.LoggedInObs.next(false);
      this.UsernameObs.next("");

      this._http.post<TokenEndpointResponse>(AUTH_N_SVC_BASEURL+"/token", body).subscribe(
        (result:TokenEndpointResponse) => {
          console.log(`got token response: ${result}`);

          if(!this._loadAccessToken(result.access_token)){
            subscriber.next(false);
            return subscriber.complete();
          }

          this._settings.accessToken = this._accessToken;
          this._settings.username = this._username;
          this._settings.save();

          this.LoggedInObs.next(true);
          subscriber.next(true);
          return subscriber.complete();
        },
        error => {
          subscriber.next(false);
          return subscriber.complete();
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

  isLoggedIn():boolean{
    if(!this._decodedToken)
      return false;

    if(this._expiresAt > Date.now())
      return true;

    return false;
  }

  logout() {
    this._accessToken = null;
    this._settings.clearToken();

  }
}
