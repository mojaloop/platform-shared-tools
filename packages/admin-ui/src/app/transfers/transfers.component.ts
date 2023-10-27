import {Component, OnDestroy, OnInit} from "@angular/core";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {paginate, PaginateResult} from "../_utils";

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html'
})
export class TransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<Transfer[]> = new BehaviorSubject<Transfer[]>([]);
	transfersSubs?: Subscription;

	readonly ALL_STR_ID = "(All)";
	entries: BehaviorSubject<Transfer[]> = new BehaviorSubject<Transfer[]>([]);
	entriesSubs?: Subscription;

	keywordState: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordCurrency: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordSourceAppName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	public criteriaFromDate = "";

	constructor(private _transfersSvc: TransfersService, private _messageService: MessageService) {
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8);
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length - 8); // remove Z, ms and secs
	}

	async ngOnInit(): Promise<void> {
		console.log("TransfersComponent ngOnInit");

		this.getSearchKeywords();

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	search(pageIndex: number = 0) {

		const filterState = (document.getElementById("filterState") as HTMLSelectElement).value || undefined;
		const filterCurrency = (document.getElementById("filterCurrency") as HTMLSelectElement).value || undefined;
		const filterId = (document.getElementById("filterId") as HTMLSelectElement).value || undefined;

		const elemFilterStartDateStr = (document.getElementById("filterStartDate") as HTMLInputElement).value;
		const filterStartDate = elemFilterStartDateStr ? new Date(elemFilterStartDateStr).valueOf() : undefined;
		const elemFilterEndDateStr = (document.getElementById("filterEndDate") as HTMLInputElement).value;
		const filterEndDate = elemFilterEndDateStr ? new Date(elemFilterEndDateStr).valueOf() : undefined;

		this.entriesSubs = this._transfersSvc.search(
			(filterState === this.ALL_STR_ID ? undefined : filterState),
			(filterCurrency === this.ALL_STR_ID ? undefined : filterCurrency),
			(filterId === this.ALL_STR_ID ? undefined : filterId),
			filterStartDate,
			filterEndDate,
			undefined, // TODO: add bulk filter box
			pageIndex
		).subscribe((result) => {
			console.log("TransfersComponent search - got TransfersSearchResults");

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

	async getSearchKeywords() {
		this.keywordsSubs = this._transfersSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("TransfersComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "state") this.keywordState.next(value.distinctTerms);
				if (value.fieldName == "currency") this.keywordCurrency.next(value.distinctTerms);
				if (value.fieldName == "id") this.keywordSourceAppName.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.transfersSubs) {
			this.transfersSubs.unsubscribe();
		}

	}
}
