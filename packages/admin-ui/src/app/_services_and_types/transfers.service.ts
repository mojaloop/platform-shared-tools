import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Transfer, TransfersSearchResults} from "src/app/_services_and_types/transfer_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
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
		state?: string,
		currency?: string,
		id?: string,
		startDate?: number,
		endDate?: number,
		bulkTransferId?: string,
		pageIndex?: number,
		pageSize: number = DEFAULT_PAGE_SIZE
	): Observable<TransfersSearchResults> {
		const searchParams = new URLSearchParams();
		if (id) searchParams.append("id", id);
		if (state) searchParams.append("state", state);
		if (currency) searchParams.append("currency", currency);
		if (startDate) searchParams.append("startDate", startDate.toString());
		if (endDate) searchParams.append("endDate", endDate.toString());
		if (bulkTransferId) searchParams.append("bulkTransferId", bulkTransferId);

		if (pageIndex) searchParams.append("pageIndex", pageIndex.toString());
		if (pageSize) searchParams.append("pageSize", pageSize.toString());

		const url = `${SVC_BASEURL}/transfers?${searchParams.toString()}`;


		return new Observable<TransfersSearchResults>(subscriber => {
			this._http.get<TransfersSearchResults>(url).subscribe(
				(result: TransfersSearchResults) => {
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
