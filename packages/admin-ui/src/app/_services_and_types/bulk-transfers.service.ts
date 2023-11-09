import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BulkTransfer} from "src/app/_services_and_types/bulk_transfer_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_bulk-transfers";

@Injectable({
	providedIn: "root",
})
export class BulkTransfersService {
	public hubId = "hub";

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		// this._http.
	}

	getAllTransfers(): Observable<BulkTransfer[]> {
		return new Observable<BulkTransfer[]>(subscriber => {
			this._http.get<BulkTransfer[]>(SVC_BASEURL + "/bulk-transfers/").subscribe(
				(result: BulkTransfer[]) => {
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

	getBulkTransfer(id: string): Observable<BulkTransfer | null> {
		return new Observable<BulkTransfer | null>(subscriber => {
			this._http.get<BulkTransfer>(SVC_BASEURL + `/bulk-transfers/${id}`).subscribe(
				(result: BulkTransfer) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
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

	
	createEmptyBulkTransfer(): BulkTransfer {
		return {
			bulkTransferId: "",
			bulkQuoteId: "",
			payerFsp: "",
			payeeFsp: "",
			completedTimestamp: null,
			expiration: null,
			individualTransfers: [],
			extensionList: null,
			transfersPreparedProcessedIds: [],
			transfersNotProcessedIds: [],
			transfersFulfiledProcessedIds: [],
			status: null
		};
	}
}
