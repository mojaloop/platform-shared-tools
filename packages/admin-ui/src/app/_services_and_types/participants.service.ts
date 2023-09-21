import { Injectable } from "@angular/core";
import { SettingsService } from "src/app/_services_and_types/settings.service";
import { HttpClient } from "@angular/common/http";
import { AllPrivilegesResp } from "./security_types";
import { Observable } from "rxjs";
import {
  PlatformRole,
  TokenEndpointResponse,
} from "@mojaloop/security-bc-public-types-lib";
import {
  IParticipantNetDebitCapChangeRequest,
  Participant,
  ParticipantAccount,
  ParticipantAccountChangeRequest,
  ParticipantAllowedSourceIp,
  ParticipantEndpoint,
  ParticipantFundsMovement,
  participantSourceIpChangeRequest,
} from "src/app/_services_and_types/participant_types";
import { AuthenticationService } from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import { UnauthorizedError } from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_participants";

@Injectable({
  providedIn: "root",
})
export class ParticipantsService {
  public hubId = "hub";

  constructor(
    private _settings: SettingsService,
    private _http: HttpClient,
    private _authentication: AuthenticationService
  ) {
    // this._http.
  }

  createEmptyParticipant(): Participant {
    const now = Date.now();
    return {
      id: "",
      type: "DFSP",
      name: "",
      isActive: false,
      description: "",
      createdDate: now,
      createdBy: this._authentication.username!,
      approved: false,
      approvedBy: null,
      approvedDate: null,
      lastUpdated: now,
      participantAllowedSourceIps: [],
      participantSourceIpChangeRequests: [],
      participantEndpoints: [],
      participantAccounts: [],
      participantAccountsChangeRequest: [],
      fundsMovements: [],
      changeLog: [],
      netDebitCapChangeRequests: [],
      netDebitCaps: [],
    };
  }

  createEmptyEndpoint(): ParticipantEndpoint {
    return {
      id: uuid.v4(),
      type: "FSPIOP",
      protocol: "HTTPs/REST",
      value: "",
    };
  }

  createEmptyAccount(): ParticipantAccount {
    return {
      id: null,
      externalBankAccountId: "",
      externalBankAccountName: "",
      type: "POSITION",
      currencyCode: "EUR",
      balance: null
    };
  }

  createEmptySourceIp(): ParticipantAllowedSourceIp {
    return {
      id: uuid.v4(),
      cidr: "",
      portMode: "ANY",
      ports: "",
      portRange: { rangeFirst: null, rangeLast: null }
    };
  }

  createEmptyNDC(): IParticipantNetDebitCapChangeRequest {
    return {
      id: uuid.v4(),
      createdBy: this._authentication.username!,
      createdDate: new Date().getTime(),
      type: "ABSOLUTE",
      fixedValue: 0,
      percentage: null,
      currencyCode: "EUR",
      note: null,
      extReference: null,
      approved: false,
      approvedBy: null,
      approvedDate: null,
    };
  }

  getAllParticipants(): Observable<Participant[]> {
    return new Observable<Participant[]>((subscriber) => {
      this._http.get<Participant[]>(SVC_BASEURL + "/participants/").subscribe(
        (result: Participant[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        (error) => {
          if (error && error.status === 403) {
            console.warn("UnauthorizedError received on getAllParticipants");
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

  getParticipant(id: string): Observable<Participant | null> {
    return new Observable<Participant | null>((subscriber) => {
      this._http
        .get<Participant>(SVC_BASEURL + `/participants/${id}`)
        .subscribe(
          (result: Participant) => {
            console.log(`got response: ${result}`);

            subscriber.next(result);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 403) {
              console.warn("UnauthorizedError received on getParticipant");
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

  createParticipant(item: Participant): Observable<string | null> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{ id: string }>(SVC_BASEURL + "/participants/", item)
        .subscribe(
          (resp: { id: string }) => {
            console.log(`got response - participantId: ${resp.id}`);

            subscriber.next(resp.id);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 403) {
              console.warn("UnauthorizedError received on createParticipant");
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

  approveParticipant(participantId: string): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this._http
        .put<void>(SVC_BASEURL + `/participants/${participantId}/approve`, {})
        .subscribe(
          (result) => {
            console.log(`got response: ${result}`);

            subscriber.next(true);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 403) {
              console.warn("UnauthorizedError received on approveParticipant");
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

  private _enableDisableParticipant(
    enable: boolean,
    participantId: string
  ): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this._http
        .put<void>(
          SVC_BASEURL +
          `/participants/${participantId}/${enable ? "enable" : "disable"}`,
          {}
        )
        .subscribe(
          (result) => {
            console.log(`got response: ${result}`);

            subscriber.next(true);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 403) {
              console.warn(
                `UnauthorizedError received on ${enable ? "enable" : "disable"
                } participant`
              );
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

  enableParticipant(participantId: string): Observable<boolean> {
    return this._enableDisableParticipant(true, participantId);
  }

  disableParticipant(participantId: string): Observable<boolean> {
    return this._enableDisableParticipant(false, participantId);
  }

  getParticipantAccounts(id: string): Observable<ParticipantAccount[]> {
    return new Observable<ParticipantAccount[]>((subscriber) => {
      this._http
        .get<ParticipantAccount[]>(SVC_BASEURL + `/participants/${id}/accounts`)
        .subscribe(
          (result: ParticipantAccount[]) => {
            console.log(`got response: ${result}`);

            subscriber.next(result);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 403) {
              console.warn(
                "UnauthorizedError received on getParticipantAccounts"
              );
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

  createAccount(
    participantId: string,
    account: ParticipantAccountChangeRequest
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{ id: string }>(
          `${SVC_BASEURL}/participants/${participantId}/accountChangeRequest`,
          account
        )
        .subscribe(
          (resp: { id: string }) => {
            console.log(`got response - accountId: ${resp.id}`);

            subscriber.next(resp.id);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on createAccount");
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

  approveAccountChangeRequest(participantId: string, requestId: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .post(
          `${SVC_BASEURL}/participants/${participantId}/accountchangerequests/${requestId}/approve`,
          {}
        )
        .subscribe(
          () => {
            console.log(`got success response from participantAccountChangeRequest`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn(
                "UnauthorizedError received on participantAccountChangeRequest"
              );
              subscriber.error(new UnauthorizedError(error.error?.msg));
            }
            if (error && error.status === 403) {
              console.warn("Forbidden received on participantAccountChangeRequest");
              subscriber.error(new Error(error.error?.msg));
            } else {
              console.error(error);
              subscriber.error(error.error?.msg);
            }
            return subscriber.complete();
          }
        );
    });
  }

  createSourceIp(
    participantId: string,
    sourceIp: participantSourceIpChangeRequest
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{ id: string }>(
          `${SVC_BASEURL}/participants/${participantId}/sourceIpChangeRequests`,
          sourceIp
        )
        .subscribe(
          (resp: { id: string }) => {
            console.log(`got response - accountId: ${resp.id}`);

            subscriber.next(resp.id);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on createSourceIp");
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

  approveSourceIpChangeRequest(participantId: string, requestId: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .post(
          `${SVC_BASEURL}/participants/${participantId}/SourceIpChangeRequests/${requestId}/approve`,
          {}
        )
        .subscribe(
          () => {
            console.log(`got success response from participantSourceIpChangeRequest`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn(
                "UnauthorizedError received on participantSourceIpChangeRequest"
              );
              subscriber.error(new UnauthorizedError(error.error?.msg));
            }
            if (error && error.status === 403) {
              console.warn("Forbidden received on participantSourceIpChangeRequest");
              subscriber.error(new Error(error.error?.msg));
            } else {
              console.error(error);
              subscriber.error(error.error?.msg);
            }
            return subscriber.complete();
          }
        );
    });
  }

  createFundsMovement(
    participantId: string,
    fundsMovRec: ParticipantFundsMovement
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{ id: string }>(
          `${SVC_BASEURL}/participants/${participantId}/funds/`,
          fundsMovRec
        )
        .subscribe(
          (resp: { id: string }) => {
            console.log(
              `got response from createFundsMovement - created id: ${resp.id}`
            );

            subscriber.next(resp.id);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on createFundsMovement");
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

  approveFundsMovement(
    participantId: string,
    fundsMovId: string
  ): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .post<{ id: string }>(
          `${SVC_BASEURL}/participants/${participantId}/funds/${fundsMovId}/approve`,
          {}
        )
        .subscribe(
          (resp: any) => {
            console.log(`got success response from approveFundsMovement`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn(
                "UnauthorizedError received on approveFundsMovement"
              );
              subscriber.error(new UnauthorizedError(error.error?.msg));
            }
            if (error && error.status === 403) {
              console.warn("Forbidden received on approveFundsMovement");
              subscriber.error(new Error(error.error?.msg));
            } else {
              console.error(error);
              subscriber.error(error.error?.msg);
            }
            return subscriber.complete();
          }
        );
    });
  }

  createNDC(
    participantId: string,
    ndc: IParticipantNetDebitCapChangeRequest
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{}>(
          `${SVC_BASEURL}/participants/${participantId}/ndcchangerequests`,
          ndc
        )
        .subscribe(
          (resp: {}) => {
            console.log(`got success response from createNDC`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on createAccount");
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

  approveNDC(participantId: string, ndcId: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .post(
          `${SVC_BASEURL}/participants/${participantId}/ndcchangerequests/${ndcId}/approve`,
          {}
        )
        .subscribe(
          () => {
            console.log(`got success response from approveNDC`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn(
                "UnauthorizedError received on approveFundsMovement"
              );
              subscriber.error(new UnauthorizedError(error.error?.msg));
            }
            if (error && error.status === 403) {
              console.warn("Forbidden received on approveFundsMovement");
              subscriber.error(new Error(error.error?.msg));
            } else {
              console.error(error);
              subscriber.error(error.error?.msg);
            }
            return subscriber.complete();
          }
        );
    });
  }

  createEndpoint(
    participantId: string,
    endpoint: ParticipantEndpoint
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._http
        .post<{ id: string }>(
          `${SVC_BASEURL}/participants/${participantId}/endpoints`,
          endpoint
        )
        .subscribe(
          (resp: { id: string }) => {
            console.log(`got response - endpointId: ${resp.id}`);

            subscriber.next(resp.id);
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on createEndpoint");
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

  changeEndpoint(
    participantId: string,
    endpoint: ParticipantEndpoint
  ): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .put<void>(
          `${SVC_BASEURL}/participants/${participantId}/endpoints/${endpoint.id}`,
          endpoint
        )
        .subscribe(
          () => {
            console.log(`got response`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on changeEndpoint");
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

  removeEndpoint(participantId: string, endpointId: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this._http
        .delete<void>(
          `${SVC_BASEURL}/participants/${participantId}/endpoints/${endpointId}`
        )
        .subscribe(
          () => {
            console.log(`got response`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on removeEndpoint");
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

  searchParticipants(
    id?: string,
    name?: string,
    state?: string
  ): Observable<Participant[]> {
    return new Observable<Participant[]>((subscriber) => {
      let url = SVC_BASEURL + "/participants/?";

      if (id) {
        url += `id=${encodeURIComponent(id)}&`;
      }
      if (name) {
        url += `name=${encodeURIComponent(name)}&`;
      }
      if (state) {
        url += `state=${encodeURIComponent(state)}&`;
      }

      if (url.endsWith("&")) {
        url = url.slice(0, url.length - 1);
      }

      this._http.get<Participant[]>(url).subscribe(
        (result: Participant[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        (error) => {
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

  /* TESTS */
  simulateTransfer(
    payerId: string,
    payeeId: string,
    amount: number,
    currencyCode: string
  ): Observable<void> {
    const body = {
      payerId: payerId,
      payeeId: payeeId,
      amount: amount.toString(),
      currencyCode: currencyCode,
    };
    return new Observable<void>((subscriber) => {
      this._http
        .post<{ id: string }>(`${SVC_BASEURL}/simulatetransfer`, body)
        .subscribe(
          (resp: any) => {
            console.log(`got success response from simulateTransfer`);

            subscriber.next();
            return subscriber.complete();
          },
          (error) => {
            if (error && error.status === 401) {
              console.warn("UnauthorizedError received on simulateTransfer");
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
