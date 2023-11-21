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


import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {
	ISettlementBatch, BatchTransferSearchResults,MatrixSearchResults,
	ISettlementBatchTransfer, ISettlementConfig,
	ISettlementMatrix, BatchSearchResults
} from "@mojaloop/settlements-bc-public-types-lib";
import * as uuid from "uuid";

const SVC_BASEURL = "/_settlements";
const REPORT_BASEURL = "/_reporting";

@Injectable({
	providedIn: "root",
})

export class SettlementsService {

	constructor(private _http: HttpClient, private _authentication: AuthenticationService) {
	}

	getAllModels(): Observable<ISettlementConfig[]> {
		return new Observable<ISettlementConfig[]>(subscriber => {
			const url = `${SVC_BASEURL}/models`;
			this._http.get<ISettlementConfig[]>(url).subscribe(
				(result: ISettlementConfig[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getAllModels");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getBatchesByCriteria(fromDate: number, toDate: number, settlementModel: string, currencyCodes: string[], batchStatuses: string[]): Observable<BatchSearchResults> {
		return new Observable<BatchSearchResults>(subscriber => {

			const searchParams = new URLSearchParams();
			// mandatory
			searchParams.append("fromDate", fromDate.toString());
			searchParams.append("toDate", toDate.toString());
			searchParams.append("settlementModel", settlementModel);

			// optional
			if (currencyCodes && currencyCodes.length > 0) searchParams.append("currencyCodes", encodeURIComponent(JSON.stringify(currencyCodes)));
			if (batchStatuses && batchStatuses.length > 0) searchParams.append("batchStatuses", encodeURIComponent(JSON.stringify(batchStatuses)));

			const url = `${SVC_BASEURL}/batches?${searchParams.toString()}`;
			this._http.get<BatchSearchResults>(url).subscribe(
				(result: BatchSearchResults) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getBatchesByCriteria");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next();
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getTransfersByBatch(batchId: string): Observable<BatchTransferSearchResults> {
		return new Observable<BatchTransferSearchResults>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?batchId=${batchId}`;
			this._http.get<BatchTransferSearchResults>(url).subscribe(
				(result: BatchTransferSearchResults) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getTransfersByBatchName");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next();
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getTransfersByMatrixId(matrixId: string): Observable<ISettlementBatchTransfer[]> {
		return new Observable<ISettlementBatchTransfer[]>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?matrixId=${matrixId}`;
			this._http.get<ISettlementBatchTransfer[]>(url).subscribe(
				(result: ISettlementBatchTransfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getTransfersByMatrixId");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}


	getTransfersByTransferId(transferId: string): Observable<ISettlementBatchTransfer | null> {
		return new Observable<ISettlementBatchTransfer | null>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?transferId=${transferId}`;
			this._http.get<ISettlementBatchTransfer | null>(url).subscribe(
				(result: ISettlementBatchTransfer | null) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getTransfersByTransferId");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next(null);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}


	getTransfersByBatchName(batchName: string): Observable<ISettlementBatchTransfer[]> {
		return new Observable<ISettlementBatchTransfer[]>(subscriber => {
			const url = `${SVC_BASEURL}/transfers?batchName=${batchName}`;
			this._http.get<ISettlementBatchTransfer[]>(url).subscribe(
				(result: ISettlementBatchTransfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getTransfersByBatchName");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}


	getAllTransfers(): Observable<ISettlementBatchTransfer[]> {
		return new Observable<ISettlementBatchTransfer[]>(subscriber => {
			const url = `${SVC_BASEURL}/transfers`;
			this._http.get<ISettlementBatchTransfer[]>(url).subscribe(
				(result: ISettlementBatchTransfer[]) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getAllTransfers");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next([]);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getMatrix(matrixId: string): Observable<ISettlementMatrix | null> {
		return new Observable<ISettlementMatrix | null>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}`;
			this._http.get<ISettlementMatrix>(url).subscribe(
				(result: ISettlementMatrix) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getMatrix");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next(null);
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}

	getMatrices(state?: string): Observable<MatrixSearchResults> {
		return new Observable<MatrixSearchResults>(subscriber => {
			let url = `${SVC_BASEURL}/matrix`;
			if (state)
				url += `?state=${state.toUpperCase()}`;

			this._http.get<MatrixSearchResults>(url).subscribe(
				(result: MatrixSearchResults) => {
					console.log(`got response: ${result}`);

					subscriber.next(result);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("Access forbidden received on getMatrices");
						subscriber.error(new UnauthorizedError(error.error?.msg));
					} else if (error && error.status === 404) {
						subscriber.next();
						return subscriber.complete();
					} else {
						console.error(error);
						subscriber.error(error.error?.msg);
					}

					return subscriber.complete();
				}
			);
		});
	}


	createDynamicMatrix(matrixId: string, settlementModel: string, currencyCodes: string[], fromDate: number, toDate: number): Observable<string> {
		return new Observable<string>(subscriber => {
			const createMatrixCmdPayload = {
				matrixId: matrixId,
				settlementModel: settlementModel,
				currencyCodes: currencyCodes,
				fromDate: fromDate,
				toDate: toDate,
				type: "DYNAMIC"
			};

			this._http.post<{ id: string }>(SVC_BASEURL + "/matrix/", createMatrixCmdPayload).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on createMatrix");
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

	createStaticMatrix(matrixId: string, batchIds: string[]): Observable<string> {
		return new Observable<string>(subscriber => {
			const createMatrixCmdPayload = {
				matrixId: matrixId,
				batchIds: batchIds,
				type: "STATIC"
			};

			this._http.post<{ id: string }>(SVC_BASEURL + "/matrix/", createMatrixCmdPayload).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on createMatrix");
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

	recalculateMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {

			const url = `${SVC_BASEURL}/matrix/${matrixId}/recalculate`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on recalculateMatrix");
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

	closeMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}/close`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on closeMatrix");
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

	disputeMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}/dispute`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on disputeMatrix");
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

	lockMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}/lock`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on disputeMatrix");
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

	unlockMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}/unlock`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on disputeMatrix");
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

	settleMatrix(matrixId: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/matrix/${matrixId}/settle`;

			this._http.post<{ id: string }>(url, {}).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - matrixId: ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				},
				error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on settleMatrix");
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

	exportSettlementMatrix(matrixId: string): Observable<Blob> {
		const url = `/_reporting/settlementInitiationByMatrixIdExport/${matrixId}`;
		const headers = new HttpHeaders();
		headers.append('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

		return this._http.get(url, {
			responseType: 'blob',
			headers,
		});
	}

	createEmptyModel(): ISettlementConfig {
		return {
			id: uuid.v4(),
			settlementModel: "",
			batchCreateInterval: 300,
			isActive: true,
			createdBy: this._authentication.username!,
			createdDate: new Date().getTime(),
			changeLog: []
		};
	}

	createSettlementModel(id: string | null, modelName: string, batchCreateIntervalSecs: number) {
		return new Observable<string>(subscriber => {
			const url = `${SVC_BASEURL}/models`;

			const data = {
				id: id,
				settlementModel: modelName,
				batchCreateInterval: batchCreateIntervalSecs,
				createdBy: this._authentication.username
			};

			this._http.post<{ id: string }>(url, data).subscribe(
				(resp: { id: string }) => {
					console.log(`got response - model create ${resp.id}`);

					subscriber.next(resp.id);
					return subscriber.complete();
				}, error => {
					if (error && error.status === 403) {
						console.warn("UnauthorizedError received on settleMatrix");
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
