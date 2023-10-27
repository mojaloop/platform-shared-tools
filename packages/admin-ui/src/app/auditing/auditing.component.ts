import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {AuditingService} from "../_services_and_types/auditing.service";
import {SignedCentralAuditEntry} from "../_services_and_types/auditing_types";
import {UnauthorizedError} from "../_services_and_types/errors";
import {MessageService} from "../_services_and_types/message.service";
import {paginate, PaginateResult} from "../_utils";

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

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	public criteriaFromDate = "";

	constructor(private _auditingSvc: AuditingService, private _messageService: MessageService) {
		this.criteriaFromDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8); // remove Z, ms and secs

	}

	ngOnInit(): void {
		console.log("AuditingComponent ngOnInit");

		this.getSearchKeywords();

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	getSearchKeywords() {
		this.keywordsSubs = this._auditingSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("AuditingComponent search - got getSearchKeywords");

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

	search(pageIndex: number = 0) {

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
			filterEndDate,
			pageIndex
		).subscribe((result) => {
			console.log("AuditingComponent search - got AuditSearchResults");

			this.entries.next(result.items);

			const pageRes = paginate(result.pageIndex, result.totalPages);
			console.log(pageRes);
			this.paginateResult.next(pageRes);
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
