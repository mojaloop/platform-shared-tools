import { Component, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { UnauthorizedError } from "src/app/_services_and_types/errors";
import { MessageService } from "src/app/_services_and_types/message.service";
import { SettlementsService } from "src/app/_services_and_types/settlements.service";
import {
	ISettlementBatch,
	ISettlementBatchTransfer,
	ISettlementMatrix
} from "@mojaloop/settlements-bc-public-types-lib";
import { ActivatedRoute } from "@angular/router";
import { paginate, PaginateResult } from "../_utils";
import { FormBuilder, FormGroup } from '@angular/forms';


@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.matrices.component.html'
})
export class SettlementsMatricesComponent implements OnInit, OnDestroy {
	readonly ALL_STR_ID = "(All)";
	private _matrixId: string | null = null;
	matrices: BehaviorSubject<ISettlementMatrix[]> = new BehaviorSubject<ISettlementMatrix[]>([]);
	matrixSubs?: Subscription;
	filterForm: FormGroup;
	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	//searchKeywords
	matrixTypeList = ["STATIC", "DYNAMIC"]; //TODO
	matrixStateList = ["IDLE", "BUSY", "FINALIZED", "OUT_OF_SYNC", "LOCKED"]; //TODO
	matrixModelList = ["DEFAULT"]; //TODO
	currencyCodeList = ["USD", "EUR"]; //TODO

	initialFilterValues = {
		filterMatrixId: null,
		filterMatrixType: this.ALL_STR_ID,
		filterMatrixState: this.ALL_STR_ID,
		filterMatrixModel: this.ALL_STR_ID,
		filterCurrency: this.ALL_STR_ID,
		filterStartDate: null,
		filterEndDate: null,
		//add initial values for other form controls (filters)
	}

	constructor(private _settlementsService: SettlementsService, private formBuilder: FormBuilder, private _messageService: MessageService) {
		this.filterForm = this.formBuilder.group(this.initialFilterValues);
	}

	ngOnInit(): void {
		console.log("SettlementsMatricesComponent ngOnInit");

		this.search(0, 10);
	}

	clearFilters() {
		this.filterForm.reset(this.initialFilterValues);
	}

	search(pageIndex?: number, pageSize?: number) {
		// For pagination
		if (pageIndex == null) {
			const pageIndexElem = document.getElementById("pageIndex") as HTMLSelectElement;
			pageIndex = parseInt(pageIndexElem?.value ?? 0);
		}
		if (pageSize == null) {
			const pageSizeElem = document.getElementById("pageSize") as HTMLSelectElement;
			pageSize = parseInt(pageSizeElem?.value ?? 10);
		}

		const {
			filterMatrixId,
			filterMatrixType,
			filterMatrixState,
			filterMatrixModel,
			filterCurrency,
			filterStartDate,
			filterEndDate
		} = this.filterForm.value;

		const matrixId = filterMatrixId || undefined;
		const type = filterMatrixType === this.ALL_STR_ID ? undefined : filterMatrixType;
		const state = filterMatrixState === this.ALL_STR_ID ? undefined : filterMatrixState;
		const model = filterMatrixModel === this.ALL_STR_ID ? undefined : filterMatrixModel;
		const currencyCodes = filterCurrency === this.ALL_STR_ID ? undefined : [filterCurrency];
		const startDate = filterStartDate ? new Date(filterStartDate).valueOf() : undefined;
		const endDate = filterEndDate ? new Date(filterEndDate).valueOf() : undefined;

		this.matrixSubs = this._settlementsService.searchMatrices(
			matrixId,
			type,
			state,
			model,
			currencyCodes,
			startDate,
			endDate,
			pageIndex,
			pageSize,
		).subscribe((matricesResult) => {
			console.log("SettlementsMatricesComponent search - got MatricesSearchResult");

			this.matrices.next(matricesResult.items);

			const pageRes = paginate(matricesResult.pageIndex, matricesResult.totalPages);
			if (pageRes) pageRes.pageSize = pageSize;
			this.paginateResult.next(pageRes);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

	}

	ngOnDestroy() {
		if (this.matrixSubs) {
			this.matrixSubs.unsubscribe();
		}
	}
}
