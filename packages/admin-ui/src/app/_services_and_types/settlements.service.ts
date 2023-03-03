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


import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {ISettlementBatch, ISettlementBatchTransfer} from "src/app/_services_and_types/settlements_types";
import {Transfer} from "src/app/_services_and_types/transfer_types";

const SVC_BASEURL = "/_settlements";

@Injectable({
	providedIn: "root",
})

export class SettlementsService {

	constructor(private _http: HttpClient, private _authentication: AuthenticationService) {}

	getBatchesByCriteria(settlementModel: string, currencyCode: string, fromDate: number, toDate: number): Observable<ISettlementBatch[]>{
		return new Observable<ISettlementBatch[]>(subscriber => {
			const url = `${SVC_BASEURL}/batches?settlementModel=${settlementModel}&currencyCode=${currencyCode}&fromDate=${fromDate}&toDate=${toDate}`;
			this._http.get<ISettlementBatch[]>(url).subscribe(
				(result: ISettlementBatch[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on getBatchesByCriteria");
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

	getTransfersByBatch(batchId: string): Observable<ISettlementBatchTransfer[]> {
		return new Observable<ISettlementBatchTransfer[]>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?batchId=${batchId}`;
			this._http.get<ISettlementBatchTransfer[]>(url).subscribe(
				(result: ISettlementBatchTransfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on getTransfersByBatchName");
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

	getTransfersByBatchName(batchName:string):Observable<ISettlementBatchTransfer[]>{
		return new Observable<ISettlementBatchTransfer[]>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?batchName=${batchName}`;
			this._http.get<ISettlementBatchTransfer[]>(url).subscribe(
				(result: ISettlementBatchTransfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status===403) {
						console.warn("Access forbidden received on getTransfersByBatchName");
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
