import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import { Quote } from "src/app/_services_and_types/quote_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import { BulkQuote } from './bulk_quote_types';

const SVC_BASEURL = "/_quotes";

@Injectable({
  providedIn: "root",
})
export class QuotesService {

  constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {}

  createEmptyQuote(): Quote {
	return {
	  requesterFspId: "",
	  destinationFspId: "",
      quoteId: "",
      bulkQuoteId: "",
      transactionId: "",
      payeePartyIdType: "",
      payeePartyIdentifier: "",
      payeeFspId: "",
      payerPartyIdType: "",
      payerPartyIdentifier: "",
      payerFspId: "",
      amountType: "SEND",
      currency: "",
      amount: null,
      scenario: "",
      initiator: "",
      initiatorType: "",
	  transactionRequestId: "",
	  payee: null,
	  payer: null,
	  transactionType: null,
	  ilpPacket: "",
	  extensionList: null
    }
  }

  createEmptyBulkQuote(): BulkQuote {
    return {
      bulkQuoteId: "",
      payer: null,
      individualQuotes: [],
	  extensionList: null,
	  quotesNotProcessedIds: []
    }
  }

  getAllQuotes(): Observable<Quote[]> {
    return new Observable<Quote[]>(subscriber => {
      this._http.get<Quote[]>(SVC_BASEURL + "/quotes/").subscribe(
        (result: Quote[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
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

  getQuote(id: string): Observable<Quote | null> {
    return new Observable<Quote | null>(subscriber => {
      this._http.get<Quote>(SVC_BASEURL + `/quotes/${id}`).subscribe(
        (result: Quote) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
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

  createQuote(item: Quote): Observable<string | null> {
    return new Observable<string>(subscriber => {

      this._http.post<{ id: string }>(SVC_BASEURL + "/quotes/", item).subscribe(
        (resp: { id: string }) => {
          console.log(`got response - quoteId: ${resp.id}`);

          subscriber.next(resp.id);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on createQuote");
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

  approveQuote(quoteId: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {

      this._http.put<void>(SVC_BASEURL + `/quotes/${quoteId}/approve`, {}).subscribe(
        (result) => {
          console.log(`got response: ${result}`);

          subscriber.next(true);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on approveQuote");
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
