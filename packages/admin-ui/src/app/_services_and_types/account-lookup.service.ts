/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 --------------
 ******/

"use strict";

import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import * as uuid from "uuid";

import {SettingsService} from "./settings.service";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "./errors";
import {Association, AssociationsSearchResults, Oracle} from "./account-lookup_types";

const SVC_BASEURL = "/_account-lookup";

const DEFAULT_PAGE_SIZE = 20;

@Injectable({
	providedIn: "root",
})
export class AccountLookupService {

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		// this._http.
	}

	createEmptyOracle(): Oracle {
		const newOracle: Oracle = {
			id: uuid.v4(),
			name: "",
			type: "builtin",
			partyType: "MSISDN",
			partySubType: null,
			endpoint: ""
		};
		return newOracle;
	}

	getRegisteredOracles(): Observable<Oracle[]> {
		return new Observable<Oracle[]>(subscriber => {
			this._http.get<Oracle[]>(SVC_BASEURL + "/admin/oracles/").subscribe(
				(result: Oracle[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getRegisteredOracles");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getRegisteredOracleById(id: string): Observable<Oracle | null> {
		return new Observable<Oracle | null>(subscriber => {
			this._http.get<Oracle | null>(SVC_BASEURL + `/admin/oracles/${id}`).subscribe(
				(result: Oracle | null) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getRegisteredOracles");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}

					return subscriber.complete();
				}
			);
		});
	}

	deleteOracle(id: string): Observable<null> {
		return new Observable<null>(subscriber => {
			this._http.delete<null>(SVC_BASEURL + `/admin/oracles/${id}`).subscribe(
				(result: null) => {
					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getRegisteredOracles");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}
					return subscriber.complete();
				}
			);
		});
	}


	registerOracle(oracle: Oracle): Observable<string | null> {
		return new Observable<string>(subscriber => {

			this._http.post<Oracle>(SVC_BASEURL + "/admin/oracles/", oracle).subscribe(
				(resp: { id: string }) => {
					console.log(`got registerOracle response - oracleId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on registerOracle");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}
					return subscriber.complete();
				}
			);
		});
	}

	healthCheck(oracleId: string): Observable<boolean> {
		return new Observable<boolean>(subscriber => {
			this._http.get<boolean>(SVC_BASEURL + `/admin/oracles/health/${oracleId}`).subscribe(
				(result: boolean) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on healthCheck");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getRegisteredAssociations(): Observable<Association[]> {
		return new Observable<Association[]>(subscriber => {
			this._http.get<Association[]>(SVC_BASEURL + "/admin/oracles/builtin-associations/").subscribe(
				(result: Association[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getRegisteredOracleAssociations");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else {
						console.error(error);
						subscriber.error(error);
					}

					return subscriber.complete();
				}
			);
		});
	}

	search(
		fspId?: string,
		partyId?: string,
		partyType?: string,
		partySubType?: string,
		currency?: string,
		pageIndex?: number,
		pageSize: number = DEFAULT_PAGE_SIZE
	): Observable<AssociationsSearchResults> {
		const searchParams = new URLSearchParams();
		if (fspId) searchParams.append("fspId", fspId);
		if (partyId) searchParams.append("partyId", partyId);
		if (partyType) searchParams.append("partyType", partyType);
		if (partySubType) searchParams.append("partySubType", partySubType);
		if (currency) searchParams.append("currency", currency);


		if (pageIndex) searchParams.append("pageIndex", pageIndex.toString());
		if (pageSize) searchParams.append("pageSize", pageSize.toString());

		const url = `${SVC_BASEURL}/admin/oracles/associations?${searchParams.toString()}`;


		return new Observable<AssociationsSearchResults>(subscriber => {
			this._http.get<AssociationsSearchResults>(url).subscribe(
				(result: AssociationsSearchResults) => {
					console.log(`got getAllAccountLookupAssociations response: ${result}`);

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
			this._http.get<{ fieldName: string, distinctTerms: string[] }[]>(`${SVC_BASEURL}/admin/oracles/builtin-associations/searchKeywords`).subscribe(
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
