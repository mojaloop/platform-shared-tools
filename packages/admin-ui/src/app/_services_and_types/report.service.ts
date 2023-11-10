import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { UnauthorizedError } from "./errors";
import type { DetailsReport, MatrixId, Report } from "./report_types";

const SVC_BASEURL = "/_reporting";

@Injectable({
	providedIn: "root",
})
export class ReportService {
	constructor(private _http: HttpClient) {}

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

	getAllSettlementDetailsReports(
		participantId: string,
		matrixId: string
	): Observable<DetailsReport[]> {
		return new Observable<DetailsReport[]>((subscriber) => {
			this._http
				.get<DetailsReport[]>(
					SVC_BASEURL +
						`/dfspSettlementDetail?participantId=${participantId}&matrixId=${matrixId}`
				)
				.subscribe(
					(result: DetailsReport[]) => {
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
