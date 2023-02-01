import {Injectable} from '@angular/core';
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {HttpClient} from "@angular/common/http";
import {AllPrivilegesResp} from "./security_types";
import {Observable} from "rxjs";
import {PlatformRole, TokenEndpointResponse} from "@mojaloop/security-bc-public-types-lib";
import {
  Participant,
  ParticipantAccount,
  ParticipantEndpoint,
  ParticipantFundsMovement
} from "src/app/_services_and_types/participant_types";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

const SVC_BASEURL = "/_participants";

@Injectable({
  providedIn: "root",
})
export class ParticipantsService {
  public hubId = "hub";

  constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
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
      participantEndpoints: [],
      participantAccounts: [],
      fundsMovements: [],
      changeLog: []
    }
  }

  createEmptyEndpoint(): ParticipantEndpoint {
    return {
      id: uuid.v4(),
      type: "FSPIOP",
      protocol: "HTTPs/REST",
      value: ""
    }
  }

  createEmptyAccount(): ParticipantAccount {
    return {
      id: uuid.v4(),
      type: "POSITION",
      currencyCode: "EUR"
    }
  }

  getAllParticipants(): Observable<Participant[]> {
    return new Observable<Participant[]>(subscriber => {
      this._http.get<Participant[]>(SVC_BASEURL + "/participants/").subscribe(
        (result: Participant[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on getAllParticipants");
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
    return new Observable<Participant | null>(subscriber => {
      this._http.get<Participant>(SVC_BASEURL + `/participants/${id}`).subscribe(
        (result: Participant) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on getParticipant");
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
    return new Observable<string>(subscriber => {

      this._http.post<{ id: string }>(SVC_BASEURL + "/participants/", item).subscribe(
        (resp: { id: string }) => {
          console.log(`got response - participantId: ${resp.id}`);

          subscriber.next(resp.id);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on createParticipant");
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
    return new Observable<boolean>(subscriber => {

      this._http.put<void>(SVC_BASEURL + `/participants/${participantId}/approve`, {}).subscribe(
        (result) => {
          console.log(`got response: ${result}`);

          subscriber.next(true);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on approveParticipant");
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

  private _enableDisableParticipant(enable: boolean, participantId: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      this._http.put<void>(SVC_BASEURL + `/participants/${participantId}/${enable ? "enable":"disable"}`, {}).subscribe(
        (result) => {
          console.log(`got response: ${result}`);

          subscriber.next(true);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn(`Access forbidden received on ${enable ? "enable":"disable"} participant`);
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
    return new Observable<ParticipantAccount[]>(subscriber => {
      this._http.get<ParticipantAccount[]>(SVC_BASEURL + `/participants/${id}/accounts`).subscribe(
        (result: ParticipantAccount[]) => {
          console.log(`got response: ${result}`);

          subscriber.next(result);
          return subscriber.complete();
        },
        error => {
          if (error && error.status===403) {
            console.warn("Access forbidden received on getParticipantAccounts");
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

  createAccount(participantId: string, account: ParticipantAccount): Observable<string> {
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/participants/${participantId}/account`, account).subscribe(
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

  createFundsMovement(participantId:string, fundsMovRec:ParticipantFundsMovement):Observable<string>{
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/participants/${participantId}/funds/`, fundsMovRec).subscribe(
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

  approveFundsMovement(participantId:string, fundsMovId:string):Observable<void>{
    return new Observable<void>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/participants/${participantId}/funds/${fundsMovId}/approve`, {}).subscribe(
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


  createEndpoint(participantId: string, endpoint: ParticipantEndpoint): Observable<string> {
    return new Observable<string>(subscriber => {
      this._http.post<{ id: string }>(`${SVC_BASEURL}/participants/${participantId}/endpoints`, endpoint).subscribe(
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

  changeEndpoint(participantId: string, endpoint: ParticipantEndpoint): Observable<void> {
    return new Observable<void>(subscriber => {
      this._http.put<void>(`${SVC_BASEURL}/participants/${participantId}/endpoints/${endpoint.id}`, endpoint).subscribe(
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

  removeEndpoint(participantId: string, endpointId: string): Observable<void> {
    return new Observable<void>(subscriber => {
      this._http.delete<void>(`${SVC_BASEURL}/participants/${participantId}/endpoints/${endpointId}`).subscribe(
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
