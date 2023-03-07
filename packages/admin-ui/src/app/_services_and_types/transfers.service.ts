import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_transfers";

@Injectable({
	providedIn: "root",
})
export class TransfersService {

	constructor(private _http: HttpClient, private _authentication: AuthenticationService) {
	}

	createEmptyTransfer(): Transfer {
		const now = Date.now();
		return {
			transferId: "",
			bulkTransferId: "",
			transactionId: "",
			payeePartyIdType: "",
			payeePartyIdentifier: "",
			payeeFspId: "",
			payerPartyIdType: "",
			payerPartyIdentifier: "",
			payerFspId: "",
			amountType: "",
			currency: "",
			amount: "",
			scenario: "",
			initiator: "",
			initiatorType: ""
		} as any
	}

	getAllTransfers(): Observable<Transfer[]> {
		return new Observable<Transfer[]>(subscriber => {
			this._http.get<Transfer[]>(SVC_BASEURL + "/transfers/").subscribe(
				(result: Transfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on getAllTransfers");
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

	searchTransfers(
		state?:string,
		currencyCode?:string,
		startDate?:number,
		endDate?:number,
		id?:string
	): Observable<Transfer[]> {
		return new Observable<Transfer[]>(subscriber => {
			let url = SVC_BASEURL + "/transfers/?";

			if(state){
				url += `state=${encodeURIComponent(state)}&`;
			}
			if(currencyCode){
				url += `currencyCode=${encodeURIComponent(currencyCode)}&`;
			}
			if(startDate){
				url += `startDate=${encodeURIComponent(startDate)}&`;
			}
			if(endDate){
				url += `endDate=${encodeURIComponent(endDate)}&`;
			}
			if(id){
				url += `id=${encodeURIComponent(id)}&`;
			}

			if(url.endsWith("&")) {
				url = url.slice(0, url.length - 1);
			}

			this._http.get<Transfer[]>(url).subscribe(
				(result: Transfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on getAllTransfers");
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

	getTransfer(id: string): Observable<Transfer | null> {
		return new Observable<Transfer | null>(subscriber => {
			this._http.get<Transfer>(SVC_BASEURL + `/transfers/${id}`).subscribe(
				(result: Transfer) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status==404) {
						subscriber.next(null);
						return subscriber.complete();
					} else if (error && error.status===403) {
						console.warn("Access forbidden received on getTransfer");
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

	createTransfer(item: Transfer): Observable<string | null> {
		return new Observable<string>(subscriber => {

			this._http.post<{ id: string }>(SVC_BASEURL + "/transfers/", item).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - transferId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on createTransfer");
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
