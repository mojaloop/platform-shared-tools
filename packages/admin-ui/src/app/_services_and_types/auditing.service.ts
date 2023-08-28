import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";

import {
} from "@mojaloop/auditing-bc-public-types-lib";
import {SignedCentralAuditEntry} from "./auditing_types";


const SVC_BASEURL = "/_auditing";

@Injectable({
	providedIn: "root",
})
export class AuditingService {
	private _envName: string;

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		this._envName = _settings.envName;
	}


	search(
		userId:string|null,
		sourceBcName:string|null,
		sourceAppName:string|null,
		actionType:string|null,
		actionSuccessful:boolean|null,
		startDate:number|null,
		endDate:number|null
	): Observable<SignedCentralAuditEntry[]> {
		let searchParams = new URLSearchParams();
		if(userId) searchParams.append("userId", userId);
		if(sourceBcName) searchParams.append("sourceBcName", sourceBcName);
		if(sourceAppName) searchParams.append("sourceAppName", sourceAppName);
		if(actionType) searchParams.append("actionType", actionType);
		if(actionSuccessful) searchParams.append("actionSuccessful", actionSuccessful.toString());
		if(startDate) searchParams.append("startDate", startDate.toString());
		if(endDate) searchParams.append("endDate", endDate.toString());

		const url = `${SVC_BASEURL}/entries?${searchParams.toString()}`;


		return new Observable<SignedCentralAuditEntry[]>(subscriber => {
			this._http.get<SignedCentralAuditEntry[]>(url).subscribe(
				(result: SignedCentralAuditEntry[]) => {
					console.log(`got getAllEntries response: ${result}`);

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

	getSearchKeywords():Observable<{fieldName:string, distinctTerms:string[]}[]>{
		return new Observable<{fieldName:string, distinctTerms:string[]}[]>(subscriber => {
			this._http.get<{fieldName:string, distinctTerms:string[]}[]>(`${SVC_BASEURL}/searchKeywords`).subscribe(
				(result: {fieldName:string, distinctTerms:string[]}[]) => {
					console.log(`got getSearchKeywords response: ${result}`);

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

}
