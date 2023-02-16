import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {
  Quote,
  QuoteAccount,
  QuoteEndpoint,
  QuoteFundsMovement
} from "src/app/_services_and_types/quote_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import { BulkQuote } from './bulk_quote_types';

const SVC_BASEURL = "/_quotes";

@Injectable({
  providedIn: "root",
})
export class QuotesService {
  public hubId = "hub";

  constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
    // this._http.
  }

  createEmptyQuote(): Quote {
    const now = Date.now();
    return {
      quoteId: "",
      bulkQuoteId: "",
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

  createEmptyBulkQuote(): BulkQuote {
    return {
      "bulkQuoteId": "",
      "payer": "",
      "individualQuotes": []
    } as any
  }

  createEmptyEndpoint(): QuoteEndpoint {
    return {
      id: uuid.v4(),
      type: "FSPIOP",
      protocol: "HTTPs/REST",
      value: ""
    }
  }

  createEmptyAccount(): QuoteAccount {
    return {
      id: uuid.v4(),
      type: "POSITION",
      currencyCode: "EUR"
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

  private _enableDisableQuote(enable: boolean, quoteId: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      this._http.put<void>(SVC_BASEURL + `/quotes/${quoteId}/${enable ? "enable":"disable"}`, {}).subscribe(
        (result) => {
          console.log(`got response: ${result}`);

          subscriber.next(true);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn(`Access forbidden received on ${enable ? "enable":"disable"} quote`);
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

  enableQuote(quoteId: string): Observable<boolean> {
    return this._enableDisableQuote(true, quoteId);
  }

  disableQuote(quoteId: string): Observable<boolean> {
    return this._enableDisableQuote(false, quoteId);
  }

  getQuoteAccounts(id: string): Observable<QuoteAccount[]> {
    return new Observable<QuoteAccount[]>(subscriber => {
      this._http.get<QuoteAccount[]>(SVC_BASEURL + `/quotes/${id}/accounts`).subscribe(
        (result: QuoteAccount[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on getQuoteAccounts");
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

  createAccount(quoteId: string, account: QuoteAccount): Observable<string> {
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/quotes/${quoteId}/account`, account).subscribe(
        (resp: { id: string }) => {
          console.log(`got response - accountId: ${resp.id}`);

          subscriber.next(resp.id);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on createAccount");
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

  createFundsMovement(quoteId:string, fundsMovRec:QuoteFundsMovement):Observable<string>{
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/quotes/${quoteId}/funds/`, fundsMovRec).subscribe(
        (resp: { id: string } ) => {
          console.log(`got response from createFundsMovement - created id: ${resp.id}`);

          subscriber.next(resp.id);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on createFundsMovement");
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

  approveFundsMovement(quoteId:string, fundsMovId:string):Observable<void>{
    return new Observable<void>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/quotes/${quoteId}/funds/${fundsMovId}/approve`, {}).subscribe(
        (resp: any ) => {
          console.log(`got success response from approveFundsMovement`);

          subscriber.next();
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on approveFundsMovement");
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


  createEndpoint(quoteId: string, endpoint: QuoteEndpoint): Observable<string> {
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/quotes/${quoteId}/endpoints`, endpoint).subscribe(
        (resp: { id: string }) => {
          console.log(`got response - endpointId: ${resp.id}`);

          subscriber.next(resp.id);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on createEndpoint");
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

  changeEndpoint(quoteId: string, endpoint: QuoteEndpoint): Observable<void> {
    return new Observable<void>(subscriber => {
      this._http.put<void>(`${SVC_BASEURL}/quotes/${quoteId}/endpoints/${endpoint.id}`, endpoint).subscribe(
        () => {
          console.log(`got response`);

          subscriber.next();
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on changeEndpoint");
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

  removeEndpoint(quoteId: string, endpointId: string): Observable<void> {
    return new Observable<void>(subscriber => {
      this._http.delete<void>(`${SVC_BASEURL}/quotes/${quoteId}/endpoints/${endpointId}`).subscribe(
        () => {
          console.log(`got response`);

          subscriber.next();
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on removeEndpoint");
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


  /* TESTS */
  simulateTransfer(payerId:string, payeeId:string, amount:number, currencyCode:string):Observable<void>{
    const body ={
      payerId:payerId,
      payeeId:payeeId,
      amount:amount.toString(),
      currencyCode:currencyCode
    };
    return new Observable<void>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/simulatetransfer`, body).subscribe(
        (resp: any ) => {
          console.log(`got success response from simulateTransfer`);

          subscriber.next();
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on simulateTransfer");
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
