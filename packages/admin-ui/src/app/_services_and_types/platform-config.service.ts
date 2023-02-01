import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {Participant, ParticipantAccount, ParticipantEndpoint} from "src/app/_services_and_types/participant_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import {
  AppConfigurationSet,
  ConfigurationSet,
  GlobalConfigurationSet
} from "src/app/_services_and_types/platform-config_types";
import semver from "semver";

const SVC_BASEURL = "/_platform-configuration-svc";
const GLOBALCONFIGSET_URL_RESOURCE_NAME = "globalConfigSets";
const APPCONFIGSET_URL_RESOURCE_NAME = "appConfigSets";


@Injectable({
  providedIn: "root",
})
export class PlatformConfigService {
  private _envName:string;

  constructor(private _settings:SettingsService, private _http: HttpClient, private _authentication:AuthenticationService) {
    this._envName = _settings.envName;
  }


  getAllAppConfigs():Observable<AppConfigurationSet[]>{
    return new Observable<AppConfigurationSet[]>(subscriber => {
      this._http.get<AppConfigurationSet[]>(`${SVC_BASEURL}/${APPCONFIGSET_URL_RESOURCE_NAME}/${this._envName}/`).subscribe(
        (result:AppConfigurationSet[]) => {
          console.log(`got getAllAppConfigs response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          console.error(error);
          subscriber.error(error);
          return subscriber.complete();
        }
      );
    });
  }

  getAllGlobalConfigs():Observable<GlobalConfigurationSet[]>{
    return new Observable<GlobalConfigurationSet[]>(subscriber => {
      this._http.get<GlobalConfigurationSet[]>(`${SVC_BASEURL}/${GLOBALCONFIGSET_URL_RESOURCE_NAME}/${this._envName}/`).subscribe(
        (result:GlobalConfigurationSet[]) => {
          console.log(`got getAllGlobalConfigs response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          console.error(error);
          subscriber.error(error);
          return subscriber.complete();
        }
      );
    });
  }

  getLatestSchemaVersion(list:ConfigurationSet[]):string|null{
    if(!list || list.length<=0) {
      return null;
    }

    const newList = list.map(item=>item);

    // sort by decreasing schemaVersion order (latest version first)
    newList.sort((a: GlobalConfigurationSet, b: GlobalConfigurationSet) => semver.compare(b.schemaVersion, a.schemaVersion));
    return newList[0].schemaVersion;
  }

}
