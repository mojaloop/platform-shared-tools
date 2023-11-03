import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";

import {} from "@mojaloop/auditing-bc-public-types-lib";
import {AuditSearchResults} from "./auditing_types";
import {UnauthorizedError} from "src/app/_services_and_types/errors";


const SVC_BASEURL = "/_auditing";

const DEFAULT_PAGE_SIZE = 20;

@Injectable({
	providedIn: "root",
})
export class AuditingService {
	private _envName: string;

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		this._envName = _settings.envName;
	}

	search(
		userId: string | null,
		sourceBcName: string | null,
		sourceAppName: string | null,
		actionType: string | null,
		actionSuccessful: boolean | null,
		startDate: number | null,
		endDate: number | null,
		pageIndex?: number,
		pageSize: number = DEFAULT_PAGE_SIZE
	): Observable<AuditSearchResults> {
		const searchParams = new URLSearchParams();
		if (userId) searchParams.append("userId", userId);
		if (sourceBcName) searchParams.append("sourceBcName", sourceBcName);
		if (sourceAppName) searchParams.append("sourceAppName", sourceAppName);
		if (actionType) searchParams.append("actionType", actionType);
		if (actionSuccessful) searchParams.append("actionSuccessful", actionSuccessful.toString());
		if (startDate) searchParams.append("startDate", startDate.toString());
		if (endDate) searchParams.append("endDate", endDate.toString());

		if (pageIndex) searchParams.append("pageIndex", pageIndex.toString());
		if (pageSize) searchParams.append("pageSize", pageSize.toString());

		const url = `${SVC_BASEURL}/entries?${searchParams.toString()}`;


		return new Observable<AuditSearchResults>(subscriber => {
			this._http.get<AuditSearchResults>(url).subscribe(
				(result: AuditSearchResults) => {
					console.log(`got getAllEntries response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on search");
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

	getSearchKeywords(): Observable<{ fieldName: string, distinctTerms: string[] }[]> {
		return new Observable<{ fieldName: string, distinctTerms: string[] }[]>(subscriber => {
			this._http.get<{ fieldName: string, distinctTerms: string[] }[]>(`${SVC_BASEURL}/searchKeywords`).subscribe(
				(result: { fieldName: string, distinctTerms: string[] }[]) => {
					console.log(`got getSearchKeywords response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getSearchKeywords");
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

}
