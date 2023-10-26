import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {Transfer, TransfersSearchResults} from "src/app/_services_and_types/transfer_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_transfers";

const DEFAULT_PAGE_SIZE = 20;

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
		} as any;
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
					if (error && error.status === 403) {
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
		state?: string,
		currencyCode?: string,
		startDate?: number,
		endDate?: number,
		id?: string
	): Observable<Transfer[]> {
		return new Observable<Transfer[]>(subscriber => {
			let url = SVC_BASEURL + "/transfers/?";

			if (state) {
				url += `state=${encodeURIComponent(state)}&`;
			}
			if (currencyCode) {
				url += `currencyCode=${encodeURIComponent(currencyCode)}&`;
			}
			if (startDate) {
				url += `startDate=${encodeURIComponent(startDate)}&`;
			}
			if (endDate) {
				url += `endDate=${encodeURIComponent(endDate)}&`;
			}
			if (id) {
				url += `id=${encodeURIComponent(id)}&`;
			}

			if (url.endsWith("&")) {
				url = url.slice(0, url.length - 1);
			}

			this._http.get<Transfer[]>(url).subscribe(
				(result: Transfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
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
					if (error && error.status == 404) {
						subscriber.next(null);
						return subscriber.complete();
					} else if (error && error.status === 403) {
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
					if (error && error.status === 403) {
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

	search(
		userId: string | null,
		state: string | null,
		currency: string | null,
		id: string | null,
		startDate: number | null,
		endDate: number | null,
		pageIndex?: number,
		pageSize: number = DEFAULT_PAGE_SIZE
	): Observable<TransfersSearchResults> {
		const searchParams = new URLSearchParams();
		if (userId) searchParams.append("userId", userId);
		if (state) searchParams.append("state", state);
		if (currency) searchParams.append("currency", currency);
		if (id) searchParams.append("id", id);
		if (startDate) searchParams.append("startDate", startDate.toString());
		if (endDate) searchParams.append("endDate", endDate.toString());

		if (pageIndex) searchParams.append("pageIndex", pageIndex.toString());
		if (pageSize) searchParams.append("pageSize", pageSize.toString());

		const url = `${SVC_BASEURL}/entries?${searchParams.toString()}`;


		return new Observable<TransfersSearchResults>(subscriber => {
			this._http.get<TransfersSearchResults>(url).subscribe(
				(result: TransfersSearchResults) => {
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

	getSearchKeywords(): Observable<{ fieldName: string, distinctTerms: string[] }[]> {
		return new Observable<{ fieldName: string, distinctTerms: string[] }[]>(subscriber => {
			this._http.get<{ fieldName: string, distinctTerms: string[] }[]>(`${SVC_BASEURL}/searchKeywords`).subscribe(
				(result: { fieldName: string, distinctTerms: string[] }[]) => {
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
