import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

import { UnauthorizedError } from "./errors";
import type {
	DetailReport,
	MatrixId,
	Report,
	SettlementInitiationReport,
} from "./report_types";

const SVC_BASEURL = "/_reporting";

@Injectable({
	providedIn: "root",
})
export class ReportService {
	constructor(private _http: HttpClient) {}

	exportSettlementInitiationByMatrixId(matrixId: string): Observable<Blob> {
		const url =
			SVC_BASEURL +
			`/settlementInitiationByMatrixId/${matrixId}?format=excel`;
		const headers = new HttpHeaders();

		return this._http.get(url, {
			responseType: "blob",
			headers,
		});
	}

	getAllSettlementInitiationReportsByMatrixId(
		matrixId: string
	): Observable<SettlementInitiationReport[]> {
		return new Observable<SettlementInitiationReport[]>((subscriber) => {
			this._http
				.get<SettlementInitiationReport[]>(
					SVC_BASEURL + `/settlementInitiationByMatrixId/${matrixId}`
				)
				.subscribe(
					(result: SettlementInitiationReport[]) => {
						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"UnauthorizedError received on getAllParticipants"
							);
							subscriber.error(
								new UnauthorizedError(error.error?.msg)
							);
						} else {
							console.error(error);
							subscriber.error(error.error?.msg);
						}

						return subscriber.complete();
					}
				);
		});
	}

	getAllSettlementMatrixIds(
		participantId: string,
		startDate: number,
		endDate: number
	): Observable<MatrixId[]> {
		return new Observable<MatrixId[]>((subscriber) => {
			this._http
				.get<MatrixId[]>(
					SVC_BASEURL +
						`/settlementMatrixIds?participantId=${participantId}&startDate=${startDate}&endDate=${endDate}`
				)
				.subscribe(
					(result: MatrixId[]) => {
						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"UnauthorizedError received on getAllParticipants"
							);
							subscriber.error(
								new UnauthorizedError(error.error?.msg)
							);
						} else {
							console.error(error);
							subscriber.error(error.error?.msg);
						}

						return subscriber.complete();
					}
				);
		});
	}

	getAllSettlementReports(
		participantId: string,
		matrixId: string
	): Observable<Report[]> {
		return new Observable<Report[]>((subscriber) => {
			this._http
				.get<Report[]>(
					SVC_BASEURL +
						`/dfspSettlement?participantId=${participantId}&matrixId=${matrixId}`
				)
				.subscribe(
					(result: Report[]) => {
						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"UnauthorizedError received on getAllParticipants"
							);
							subscriber.error(
								new UnauthorizedError(error.error?.msg)
							);
						} else {
							console.error(error);
							subscriber.error(error.error?.msg);
						}

						return subscriber.complete();
					}
				);
		});
	}

	getAllSettlementDetailReports(
		participantId: string,
		matrixId: string
	): Observable<DetailReport[]> {
		return new Observable<DetailReport[]>((subscriber) => {
			this._http
				.get<DetailReport[]>(
					SVC_BASEURL +
						`/dfspSettlementDetail?participantId=${participantId}&matrixId=${matrixId}`
				)
				.subscribe(
					(result: DetailReport[]) => {
						subscriber.next(result);
						return subscriber.complete();
					},
					(error) => {
						if (error && error.status === 403) {
							console.warn(
								"UnauthorizedError received on getAllParticipants"
							);
							subscriber.error(
								new UnauthorizedError(error.error?.msg)
							);
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
