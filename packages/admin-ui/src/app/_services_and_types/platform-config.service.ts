import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";

import {
	ConfigurationSet,
	BoundedContextConfigurationSet,
	GlobalConfigurationSet,
	BCCONFIGSET_URL_RESOURCE_NAME,
	GLOBALCONFIGSET_URL_RESOURCE_NAME
} from "@mojaloop/platform-configuration-bc-public-types-lib";

import semver from "semver";

const SVC_BASEURL = "/_platform-configuration-svc";


@Injectable({
	providedIn: "root",
})
export class PlatformConfigService {
	private _envName: string;

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		this._envName = _settings.envName;
	}


	getAllBcConfigs(): Observable<BoundedContextConfigurationSet[]> {
		return new Observable<BoundedContextConfigurationSet[]>(subscriber => {
			this._http.get<BoundedContextConfigurationSet[]>(`${SVC_BASEURL}/${BCCONFIGSET_URL_RESOURCE_NAME}/`).subscribe(
				(result: BoundedContextConfigurationSet[]) => {
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

	getAllGlobalConfigs(): Observable<GlobalConfigurationSet[]> {
		return new Observable<GlobalConfigurationSet[]>(subscriber => {
			this._http.get<GlobalConfigurationSet[]>(`${SVC_BASEURL}/${GLOBALCONFIGSET_URL_RESOURCE_NAME}/`).subscribe(
				(result: GlobalConfigurationSet[]) => {
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

	getLatestSchemaVersion(list: ConfigurationSet[]): string | null {
		if (!list || list.length <= 0) {
			return null;
		}

		const newList = list.map(item => item);

		// sort by decreasing schemaVersion order (latest version first)
		newList.sort((a: GlobalConfigurationSet, b: GlobalConfigurationSet) => semver.compare(b.schemaVersion, a.schemaVersion));
		return newList[0].schemaVersion;
	}

}
