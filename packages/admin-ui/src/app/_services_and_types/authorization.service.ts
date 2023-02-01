import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";

const AUTH_Z_SVC_BASEURL = "/auth_z";

@Injectable({
  providedIn: "root",
})
export class AuthorizationService {

  constructor(private _settings:SettingsService, private _http: HttpClient) {

  }

  getAllPrivileges():Observable<AllPrivilegesResp[]>{
    return new Observable<AllPrivilegesResp[]>(subscriber => {
      this._http.get<AllPrivilegesResp[]>(AUTH_Z_SVC_BASEURL+"/appPrivileges").subscribe(
        (result:AllPrivilegesResp[]) => {
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

  getAllPlatformRoles():Observable<PlatformRole[]>{
    return new Observable<PlatformRole[]>(subscriber => {
      this._http.get<PlatformRole[]>(AUTH_Z_SVC_BASEURL+"/platformRoles").subscribe(
        (result:PlatformRole[]) => {
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
}
