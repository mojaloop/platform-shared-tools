import { Injectable } from "@angular/core";
import { SettingsService } from "src/app/_services_and_types/settings.service";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
	IParticipantNetDebitCapChangeRequest,
	IParticipant,
	IParticipantAccount,
	IParticipantAccountChangeRequest,
	IParticipantAllowedSourceIp,
	IParticipantEndpoint,
	IParticipantFundsMovement,
	IParticipantSourceIpChangeRequest,
	ParticipantTypes,
	ParticipantEndpointTypes,
	ParticipantEndpointProtocols,
	ParticipantAccountTypes,
	ParticipantAllowedSourceIpsPortModes,
	ParticipantNetDebitCapTypes,
	IParticipantContactInfo,
	IParticipantStatusChangeRequest,
	ApprovalRequestState,
} from "@mojaloop/participant-bc-public-types-lib";
import { AuthenticationService } from "src/app/_services_and_types/authentication.service";
import * as uuid from "uuid";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import {
	IParticipantPendingApproval,
	IParticipantPendingApprovalSummary,
	FundMovement,
	ParticipantsSearchResults,
	IBulkApprovalResult,
} from "./participant_types";

const SVC_BASEURL = "/_participants";

const DEFAULT_PAGE_SIZE = 20;

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

	validateSettlementInitiationFile(
		settlementInitiation: File
	): Observable<FundMovement[]> {
		return new Observable<FundMovement[]>((subscriber) => {
			this._http
				.post<FundMovement[]>(
					`${SVC_BASEURL}/participants/liquidityCheckValidate`,
					{ settlementInitiation },
					{
						headers: {
							"Content-Type": "multipart/form-data",
						}
					}
				)
				.subscribe(
					(result) => {
						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on validateSettlementInitiationFile"
							);
							subscriber.error(
								new UnauthorizedError(error.error?.msg)
							);
						}
						if (error && error.status === 403) {
							console.warn(
								"Forbidden received on validateSettlementInitiationFile"
							);
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

	requestFundAdjustment(
		fundAdjustments: FundMovement[],
		ignoreDuplicate: boolean
	): Observable<void> {
		return new Observable((subscriber) => {
			let url = `${SVC_BASEURL}/participants/liquidityCheckRequestAdjustment`;
			if (ignoreDuplicate) url += "?ignoreDuplicate=true";

			this._http.post(url, fundAdjustments).subscribe(
				() => {
					subscriber.next();
					return subscriber.complete();
				},
				(error) => {
					if (error && error.status === 401) {
						console.warn("UnauthorizedError received on requestAdjustment");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					}
					if (error && error.status === 403) {
						console.warn("Forbidden received on requestAdjustment");
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

	createEmptyParticipant(): IParticipant {
		const now = Date.now();
		return {
			id: "",
			type: ParticipantTypes.DFSP,
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
			participantContacts: [],
			participantContactInfoChangeRequests: [],
			participantStatusChangeRequests: [],
		};
	}

	createEmptyEndpoint(): IParticipantEndpoint {
		return {
			id: uuid.v4(),
			type: ParticipantEndpointTypes.FSPIOP,
			protocol: ParticipantEndpointProtocols["HTTPs/REST"],
			value: "",
		};
	}

	createEmptyAccount(): IParticipantAccount {
		return {
			id: uuid.v4(),
			externalBankAccountId: "",
			externalBankAccountName: "",
			type: ParticipantAccountTypes.POSITION,
			currencyCode: "EUR",
			balance: null,
			creditBalance: null,
			debitBalance: null,
		};
	}

	createEmptySourceIp(): IParticipantAllowedSourceIp {
		return {
			id: uuid.v4(),
			cidr: "",
			portMode: ParticipantAllowedSourceIpsPortModes.ANY,
			ports: [],
			portRange: {
				rangeFirst: 0,
				rangeLast: 0,
			},
		};
	}

	createEmptyContactInfo(): IParticipantContactInfo {
		return {
			id: uuid.v4(),
			name: "",
			email: "",
			phoneNumber: "",
			role: "",
		};
	}

	createEmptyNDC(): IParticipantNetDebitCapChangeRequest {
		return {
			id: uuid.v4(),
			createdBy: this._authentication.username!,
			createdDate: new Date().getTime(),
			type: ParticipantNetDebitCapTypes.ABSOLUTE,
			fixedValue: 0,
			percentage: null,
			currencyCode: "EUR",
			note: null,
			extReference: null,
			rejectedBy: null,
			rejectedDate: null,
			approvedBy: null,
			approvedDate: null,
			requestState: ApprovalRequestState.CREATED,
		};
	}

	getAllParticipants(): Observable<ParticipantsSearchResults> {
		return new Observable<ParticipantsSearchResults>((subscriber) => {
			this._http
				.get<ParticipantsSearchResults>(SVC_BASEURL + "/participants/")
				.subscribe(
					(result: ParticipantsSearchResults) => {
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

	getParticipant(id: string): Observable<IParticipant | null> {
		return new Observable<IParticipant | null>((subscriber) => {
			this._http
				.get<IParticipant>(SVC_BASEURL + `/participants/${id}`)
				.subscribe(
					(result: IParticipant) => {
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

	createParticipant(item: IParticipant): Observable<string | null> {
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

	createParticipantStatusChangeRequest(
		participantId: string,
		statusChangeRequest: IParticipantStatusChangeRequest
	): Observable<string> {
		return new Observable<string>((subscriber) => {
			this._http
				.post<{ id: string }>(
					`${SVC_BASEURL}/participants/${participantId}/statusChangeRequests`,
					statusChangeRequest
				)
				.subscribe(
					(resp: { id: string }) => {
						console.log(`got response - participant: ${resp.id}`);

						subscriber.next(resp.id);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on updating participant status"
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

	approveParticipantStatusChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/statusChangeRequests/${requestId}/approve`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from participantAccountChangeRequest`
						);

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
							console.warn(
								"Forbidden received on approveParticipantAccountChangeRequest"
							);
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

	rejectParticipantStatusChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/statusChangeRequests/${requestId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from rejectParticipantAccountChangeRequest`
						);

						subscriber.next();
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on rejectParticipantAccountChangeRequest"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn(
								"Forbidden received on rejectParticipantAccountChangeRequest"
							);
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

	getParticipantAccounts(id: string): Observable<IParticipantAccount[]> {
		return new Observable<IParticipantAccount[]>((subscriber) => {
			this._http
				.get<IParticipantAccount[]>(
					SVC_BASEURL + `/participants/${id}/accounts`
				)
				.subscribe(
					(result: IParticipantAccount[]) => {
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
		account: IParticipantAccountChangeRequest
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

	approveAccountChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/accountchangerequests/${requestId}/approve`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from participantAccountChangeRequest`
						);

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
							console.warn(
								"Forbidden received on participantAccountChangeRequest"
							);
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

	rejectAccountChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/accountchangerequests/${requestId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from participantAccountChangeRequest`
						);

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
							console.warn(
								"Forbidden received on participantAccountChangeRequest"
							);
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
		sourceIp: IParticipantSourceIpChangeRequest
	): Observable<string> {
		return new Observable<string>((subscriber) => {
			this._http
				.post<{ id: string }>(
					`${SVC_BASEURL}/participants/${participantId}/sourceIpChangeRequests`,
					sourceIp
				)
				.subscribe(
					(resp: { id: string }) => {
						console.log(`got response - sourceIpId: ${resp.id}`);

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

	approveSourceIpChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/SourceIpChangeRequests/${requestId}/approve`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from participantSourceIpChangeRequest`
						);

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
							console.warn(
								"Forbidden received on participantSourceIpChangeRequest"
							);
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

	rejectSourceIpChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/SourceIpChangeRequests/${requestId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(
							`got success response from participantSourceIpChangeRequest`
						);

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
							console.warn(
								"Forbidden received on participantSourceIpChangeRequest"
							);
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
		fundsMovRec: IParticipantFundsMovement
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
					() => {
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

	rejectFundsMovement(
		participantId: string,
		fundsMovId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post<{ id: string }>(
					`${SVC_BASEURL}/participants/${participantId}/funds/${fundsMovId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(`got success response from rejectFundsMovement`);

						subscriber.next();
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on rejectFundsMovement"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn("Forbidden received on rejectFundsMovement");
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
				.post<void>(
					`${SVC_BASEURL}/participants/${participantId}/ndcchangerequests`,
					ndc
				)
				.subscribe(
					() => {
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
								"UnauthorizedError received on approveNDC"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn("Forbidden received on approveNDC");
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

	rejectNDC(participantId: string, ndcId: string): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/ndcchangerequests/${ndcId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(`got success response from rejectNDC`);

						subscriber.next();
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on rejectNDC"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn("Forbidden received on rejectNDC");
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
		endpoint: IParticipantEndpoint
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
		endpoint: IParticipantEndpoint
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
	): Observable<IParticipant[]> {
		return new Observable<IParticipant[]>((subscriber) => {
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

			this._http.get<IParticipant[]>(url).subscribe(
				(result: IParticipant[]) => {
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

	createContactInfo(
		participantId: string,
		contactInfo: IParticipantContactInfo
	): Observable<string> {
		return new Observable<string>((subscriber) => {
			this._http
				.post<{ id: string }>(
					`${SVC_BASEURL}/participants/${participantId}/contactInfoChangeRequests`,
					contactInfo
				)
				.subscribe(
					(resp: { id: string }) => {
						console.log(`got response - contactId: ${resp.id}`);

						subscriber.next(resp.id);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn("UnauthorizedError received on createContactInfo");
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

	approveContactInfoChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/contactInfoChangeRequests/${requestId}/approve`,
					{}
				)
				.subscribe(
					() => {
						console.log(`got success response from contactInfoChangeRequests`);

						subscriber.next();
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on contactInfoChangeRequests"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn("Forbidden received on contactInfoChangeRequests");
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

	rejectContactInfoChangeRequest(
		participantId: string,
		requestId: string
	): Observable<void> {
		return new Observable<void>((subscriber) => {
			this._http
				.post(
					`${SVC_BASEURL}/participants/${participantId}/contactInfoChangeRequests/${requestId}/reject`,
					{}
				)
				.subscribe(
					() => {
						console.log(`got success response from rejectContactInfoChangeRequest`);

						subscriber.next();
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 401) {
							console.warn(
								"UnauthorizedError received on rejectContactInfoChangeRequest"
							);
							subscriber.error(new UnauthorizedError(error.error?.msg));
						}
						if (error && error.status === 403) {
							console.warn("Forbidden received on rejectContactInfoChangeRequest");
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

	search(
		state?: string,
		id?: string,
		name?: string,
		pageIndex?: number,
		pageSize: number = DEFAULT_PAGE_SIZE
	): Observable<ParticipantsSearchResults> {
		const searchParams = new URLSearchParams();
		if (state) searchParams.append("state", state);
		if (id) searchParams.append("id", id);
		if (name) searchParams.append("name", name);

		if (pageIndex) searchParams.append("pageIndex", pageIndex.toString());
		if (pageSize) searchParams.append("pageSize", pageSize.toString());

		const url = `${SVC_BASEURL}/participants?${searchParams.toString()}`;

		return new Observable<ParticipantsSearchResults>((subscriber) => {
			this._http.get<ParticipantsSearchResults>(url).subscribe(
				(result: ParticipantsSearchResults) => {
					console.log(`got getAllEntries response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				(error) => {
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

	getSearchKeywords(): Observable<
		{ fieldName: string; distinctTerms: string[] }[]
	> {
		return new Observable<{ fieldName: string; distinctTerms: string[] }[]>(
			(subscriber) => {
				this._http
					.get<{ fieldName: string; distinctTerms: string[] }[]>(
						`${SVC_BASEURL}/searchKeywords`
					)
					.subscribe(
						(result: { fieldName: string; distinctTerms: string[] }[]) => {
							console.log(`got getSearchKeywords response: ${result}`);

							subscriber.next(result);
							return subscriber.complete();
						},
						(error) => {
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
			}
		);
	}

	getPendingApprovalsSummary() {
		return new Observable<IParticipantPendingApprovalSummary>((subscriber) => {
			this._http
				.get<IParticipantPendingApprovalSummary>(
					`${SVC_BASEURL}/participants/pendingApprovalsSummary`
				)
				.subscribe(
					(result: IParticipantPendingApprovalSummary) => {
						console.log(`got getPendingApprovalSummary response: ${result}`);

						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"Access forbidden received on getPendingApprovalSummary"
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

	getPendingApprovals() {
		return new Observable<IParticipantPendingApproval>((subscriber) => {
			this._http
				.get<IParticipantPendingApproval>(
					`${SVC_BASEURL}/participants/pendingApprovals`
				)
				.subscribe(
					(result: IParticipantPendingApproval) => {
						console.log(`got getPendingApprovals response: ${result}`);

						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn("Access forbidden received on getPendingApprovals");
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

	submitPendingApprovals(data: IParticipantPendingApproval, requestState:ApprovalRequestState) {
		const url = requestState == ApprovalRequestState.APPROVED? 
					`${SVC_BASEURL}/participants/pendingApprovals/approve`:
					`${SVC_BASEURL}/participants/pendingApprovals/reject`;

		return new Observable<IBulkApprovalResult[]>((subscriber) => {
			this._http
				.post<IParticipantPendingApproval>(
					url,
					data
				)
				.subscribe(
					(result: any) => {
						console.log(`got submitPendingApprovals response: ${result}`);

						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"Access forbidden received on submitPendingApprovals"
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
					() => {
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
