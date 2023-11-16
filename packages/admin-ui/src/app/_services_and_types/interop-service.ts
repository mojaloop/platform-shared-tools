/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 --------------
 ******/

"use strict";

import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";

import {SettingsService} from "./settings.service";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {Quote} from "./quote_types";
import {BulkQuote} from "./bulk_quote_types";
import {Transfer} from "./transfer_types";
import { BulkTransfer } from "./bulk_transfer_types";
//  import {} from "./interop_types";

const SVC_BASEURL = "/_interop";

@Injectable({
	providedIn: "root",
})
export class InteropService {

	constructor(private _settings: SettingsService, private _http: HttpClient, private _authentication: AuthenticationService) {
	}

	associateParticipant(participantId: string, partyType: string, partyId: string, partySubType: string, currencyCode: string): Observable<any> {
		const URL = partySubType ? `${SVC_BASEURL}/participants/${partyType}/${partyId}/${partySubType}` : `${SVC_BASEURL}/participants/${partyType}/${partyId}`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders().set("fspiop-source", participantId)
				.set("fspiop-date", new Date().toISOString());

			this._http.post<any>(URL, {fspId: participantId, currency: currencyCode}, {headers}).subscribe(
				(result: any) => {
					console.log(`POST associate response: ${result}`);

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

	disassociateParticipant(participantId: string, partyType: string, partyId: string, partySubType: string, currencyCode: string): Observable<any> {
		const URL = partySubType ? `${SVC_BASEURL}/participants/${partyType}/${partyId}/${partySubType}?currency=${currencyCode}` : `${SVC_BASEURL}/participants/${partyType}/${partyId}?currency=${currencyCode}`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders().set("fspiop-source", participantId)
				.set("fspiop-date", new Date().toISOString());

			this._http.delete<any>(URL, {headers}).subscribe(
				(result: any) => {
					console.log(`DELETE disassociate response: ${result}`);

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

	getParticipant(participantId: string, partyType: string, partyId: string, partySubType: string, currencyCode: string): Observable<any> {
		const URL = partySubType ? `${SVC_BASEURL}/participants/${partyType}/${partyId}/${partySubType}?currency=${currencyCode}` : `${SVC_BASEURL}/participants/${partyType}/${partyId}?currency=${currencyCode}`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders().set("fspiop-source", participantId)
				.set("fspiop-date", new Date().toISOString());

			this._http.get<any>(URL, {headers}).subscribe(
				(result: any) => {
					console.log(`GET participant response: ${result}`);

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

	getParty(participantId: string, partyType: string, partyId: string, partySubType: string, currencyCode: string): Observable<any> {
		const URL = partySubType ? `${SVC_BASEURL}/parties/${partyType}/${partyId}/${partySubType}?currency=${currencyCode}` : `${SVC_BASEURL}/parties/${partyType}/${partyId}?currency=${currencyCode}`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders().set("fspiop-source", participantId)
				.set("fspiop-date", new Date().toISOString());

			this._http.get<any>(URL, {headers}).subscribe(
				(result: any) => {
					console.log(`GET party response: ${result}`);

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

	// Quotes
	createQuoteRequest(quote: Quote): Observable<any> {
		const URL = `${SVC_BASEURL}/quotes`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders().set("fspiop-source", quote?.payer?.partyIdInfo.fspId as string)
				.set("fspiop-date", new Date().toISOString());

			const body = {...quote};

			this._http.post<any>(URL, body, {headers}).subscribe(
				(result: any) => {
					console.log(`GET quote response: ${result}`);

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

	createBulkQuoteRequest(bulkQuote: BulkQuote): Observable<any> {
		const URL = `${SVC_BASEURL}/bulkQuotes`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders()
			.set("fspiop-source", bulkQuote?.payer?.partyIdInfo.fspId as string)
			.set("fspiop-destination", bulkQuote?.individualQuotes[0].payee?.partyIdInfo.fspId as string)
			.set("fspiop-date", new Date().toISOString());

			const body = {...bulkQuote};

			this._http.post<any>(URL, body, {headers}).subscribe(
				(result: any) => {
					console.log(`GET bulk quote response: ${result}`);

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

	createTransferRequest(transfer: Transfer): Observable<any> {
		const URL = `${SVC_BASEURL}/transfers`;

		const headers = new HttpHeaders().set("fspiop-source", transfer.payerFsp)
			.set("fspiop-date", new Date().toISOString());

		return new Observable<any>(subscriber => {
			const body = {...transfer};

			this._http.post<any>(URL, body, {headers}).subscribe(
				(result: any) => {
					console.log(`GET transfer response: ${result}`);

					subscriber.next();
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

	createBulkTransferRequest(bulkTransfer: BulkTransfer): Observable<any> {
		const URL = `${SVC_BASEURL}/bulkTransfers`;

		return new Observable<any>(subscriber => {
			const headers = new HttpHeaders()
			.set("fspiop-source", bulkTransfer.payerFsp)
			.set("fspiop-destination", bulkTransfer.payeeFsp)
			.set("fspiop-date", new Date().toISOString());

			const body = {...bulkTransfer};

			this._http.post<any>(URL, body, {headers}).subscribe(
				(result: any) => {
					console.log(`GET bulk transfer response: ${result}`);

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
