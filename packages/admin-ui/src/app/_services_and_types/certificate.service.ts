import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthenticationService } from "src/app/_services_and_types/authentication.service";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import {Certificate, CertificateRequest} from "./certificate_types";

const SVC_BASEURL = "/_certificates";

@Injectable({
    providedIn: "root",
})
export class CertificatesService {

    constructor(
        private http: HttpClient,
        private authentication: AuthenticationService
    ) {}

    uploadCertificate(participantId: string,file: File): Observable<Certificate> {
        const formData = new FormData();
        formData.append("cert", file);
		formData.append("participantId", participantId);

        return new Observable<any>((subscriber) => {
            this.http.post<any>(`${SVC_BASEURL}/certs/file`, formData)
                .subscribe({
                    next: (response) => {
                      subscriber.next(response);
                      subscriber.complete();
                    },
                    error: (error) => this.handleError(error, subscriber)
                });
        });
    }

	getApprovedCertificate(participantId: string): Observable<Certificate> {
		return new Observable<any>((subscriber) => {
			this.http.get<any>(`${SVC_BASEURL}/certs/${participantId}`)
				.subscribe({
					next: (response) => {
						subscriber.next(response);
						subscriber.complete();
					},
					error: (error) => this.handleError(error, subscriber)
				});
		});
	}

    getPendingCertificates(participantId: string | null = null): Observable<CertificateRequest[]> {
		let url = `${SVC_BASEURL}/certs/requests`;
		if (participantId !== null && participantId !== undefined && participantId !== "") {
			url += `?participantId=${participantId}`;
		}

        return new Observable<any[]>((subscriber) => {
            this.http.get<any[]>(url)
                .subscribe({
                    next: (certificates) => subscriber.next(certificates),
                    error: (error) => this.handleError(error, subscriber)
                });
        });
    }

    approveCertificate(certificateId: string): Observable<void> {
        return new Observable<void>((subscriber) => {
            this.http.post<void>(`${SVC_BASEURL}/certs/${certificateId}/approve`, {})
                .subscribe({
                    next: () => subscriber.next(),
                    error: (error) => this.handleError(error, subscriber)
                });
        });
    }

    rejectCertificate(certificateId: string, participantId: string): Observable<void> {
        return new Observable<void>((subscriber) => {
            this.http.post<void>(`${SVC_BASEURL}/certs/${certificateId}/reject/${participantId}`, {})
                .subscribe({
                    next: () => subscriber.next(),
                    error: (error) => this.handleError(error, subscriber)
                });
        });
    }

	bulkApproveCertificates(certificateIds: string[]): Observable<void> {
		return new Observable<void>((subscriber) => {
			this.http.post<void>(`${SVC_BASEURL}/certs/bulkapprove`, {certificateIds})
				.subscribe({
					next: () => subscriber.next(),
					error: (error) => this.handleError(error, subscriber)
				});
		});
	}

	bulkRejectCertificates(certificateIds: string[]): Observable<void> {
		return new Observable<void>((subscriber) => {
			this.http.post<void>(`${SVC_BASEURL}/certs/bulkreject`, {certificateIds})
				.subscribe({
					next: () => subscriber.next(),
					error: (error) => this.handleError(error, subscriber)
				});
		});
	}

    private handleError(error: any, subscriber: any) {
        if (error.status === 401) {
            console.warn("UnauthorizedError received");
            subscriber.error(new UnauthorizedError(error.error?.msg || "Unauthorized"));
        } else if (error.status === 403) {
            console.warn("Forbidden received");
            subscriber.error(new Error(error.error?.msg || "Forbidden"));
        } else {
            console.error(error);
            subscriber.error(new Error(error.error?.msg || "An error occurred"));
        }
        subscriber.complete();
    }
}
