import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {AuditingService} from "../_services_and_types/auditing.service";
import {SignedCentralAuditEntry} from "../_services_and_types/auditing_types";
import {UnauthorizedError} from "../_services_and_types/errors";
import {MessageService} from "../_services_and_types/message.service";

@Component({
	selector: "app-security",
	templateUrl: "./auditing.component.html"
})
export class AuditingComponent implements OnInit, OnDestroy {
	readonly ALL_STR_ID = "(All)";
	entries: BehaviorSubject<SignedCentralAuditEntry[]> = new BehaviorSubject<SignedCentralAuditEntry[]>([]);
	entriesSubs?: Subscription;

	keywordActionType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordSourceBcName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordSourceAppName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	constructor(private _auditingSvc: AuditingService, private _messageService: MessageService) {
	}

	async ngOnInit(): Promise<void> {
		console.log("SecurityComponent ngOnInit");

		await this.getSearchKeywords();
		this.search();

	}

	getSearchKeywords() {
		this.keywordsSubs = this._auditingSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("TransfersComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "actionType") this.keywordActionType.next(value.distinctTerms);
				if (value.fieldName == "sourceBcName") this.keywordSourceBcName.next(value.distinctTerms);
				if (value.fieldName == "sourceAppName") this.keywordSourceAppName.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	search() {

		// const filterText = (document.getElementById("filterText") as HTMLInputElement).value || null;
		const filterSourceBcName = (document.getElementById("filterSourceBcName") as HTMLSelectElement).value || null;
		const filterSourceAppName = (document.getElementById("filterSourceAppName") as HTMLSelectElement).value || null;
		const filterActionType = (document.getElementById("filterActionType") as HTMLSelectElement).value || null;

		const elemFilterStartDateStr = (document.getElementById("filterStartDate") as HTMLInputElement).value;
		const filterStartDate = elemFilterStartDateStr ? new Date(elemFilterStartDateStr).valueOf() : null;
		const elemFilterEndDateStr = (document.getElementById("filterEndDate") as HTMLInputElement).value;
		const filterEndDate = elemFilterEndDateStr ? new Date(elemFilterEndDateStr).valueOf() : null;

		this.entriesSubs = this._auditingSvc.search(
			null,
			(filterSourceBcName === this.ALL_STR_ID ? null : filterSourceBcName),
			(filterSourceAppName === this.ALL_STR_ID ? null : filterSourceAppName),
			(filterActionType === this.ALL_STR_ID ? null : filterActionType),
			null,
			filterStartDate,
			filterEndDate
		).subscribe((list) => {
			console.log("TransfersComponent search - got searchTransfers");

			this.entries.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.entriesSubs) {
			this.entriesSubs.unsubscribe();
		}

	}
}
