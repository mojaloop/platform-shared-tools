import {Injectable} from "@angular/core";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BulkQuote} from "src/app/_services_and_types/bulk_quote_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_bulk-quotes";

@Injectable({
	providedIn: "root",
})
export class BulkQuotesService {
	public hubId = "hub";

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
		// this._http.
	}

	getAllQuotes(): Observable<BulkQuote[]> {
		return new Observable<BulkQuote[]>(subscriber => {
			this._http.get<BulkQuote[]>(SVC_BASEURL + "/bulk-quotes/").subscribe(
				(result: BulkQuote[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getAllQuotes");
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

	getBulkQuote(id: string): Observable<BulkQuote | null> {
		return new Observable<BulkQuote | null>(subscriber => {
			this._http.get<BulkQuote>(SVC_BASEURL + `/bulk-quotes/${id}`).subscribe(
				(result: BulkQuote) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getQuote");
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

	createBulkQuote(item: BulkQuote): Observable<string | null> {
		return new Observable<string>((subscriber) => {
			this._http.post<{ id: string }>(SVC_BASEURL + "/bulk-quotes/", item).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - bulkQuoteId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				(error) => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on createBulkQuote");
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

	createEmptyBulkQuote(): BulkQuote {
		return {
			bulkQuoteId: "",
			payer: null,
			individualQuotes: [],
			extensionList: null,
			quotesNotProcessedIds: []
		};
	}
}
