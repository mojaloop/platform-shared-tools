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
import { FormBuilder, FormGroup } from "@angular/forms";


@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.matrices.component.html'
})
export class SettlementsMatricesComponent implements OnInit, OnDestroy {
	private _matrixId: string | null = null;
	matrices: BehaviorSubject<ISettlementMatrix[]> = new BehaviorSubject<ISettlementMatrix[]>([]);
	matrixSubs?: Subscription;
	filterForm: FormGroup;
	initialValues = {
		filterMatrixId: null,
		filterMatrixType: 'ALL',
		filterMatrixState: 'ALL',
		filterMatrixModel: 'ALL',
		filterCurrency: 'ALL',
		filterCreatedDate: 'ALL',
		//add initial values for other form controls (filters)
	}

	//filter options
	currencyCodeList = ["ALL", "EUR", "USD"];


	search() {
		const { filterMatrixId, filterMatrixType, filterMatrixState, filterMatrixModel, filterCurrency, filterCreatedDate } = this.filterForm.value
		console.log('formValue', this.filterForm.value);

		const id = filterMatrixId || undefined;
		const matrixType = filterMatrixType.toUpperCase() === "ALL" ? undefined : filterMatrixType;
		const matrixState = filterMatrixState.toUpperCase() === "ALL" ? undefined : filterMatrixState;
		const matrixModel = filterMatrixModel.toUpperCase() === "ALL" ? undefined : filterMatrixModel;
		const currency = filterCurrency.toUpperCase() === "ALL" ? undefined : filterCurrency;
		const createdDate = filterCreatedDate ? new Date(filterCreatedDate).valueOf() : undefined;
	}

	constructor(private formBuilder: FormBuilder, private _settlementsService: SettlementsService, private _messageService: MessageService) {
		this.filterForm = this.formBuilder.group(this.initialValues);
	}

	ngOnInit(): void {
		console.log("SettlementsMatricesComponent ngOnInit");

		this._fetchMatrices();
	}


	clearFilters() {
		this.filterForm.reset(this.initialValues);
	}

	private async _fetchMatrices(state?: string): Promise<void> {
		return new Promise(resolve => {
			this._settlementsService.getMatrices(state).subscribe(matrix => {
				this.matrices.next(matrix);
				resolve();
			});
		});

	}


	ngOnDestroy() {
		if (this.matrixSubs) {
			this.matrixSubs.unsubscribe();
		}
	}
}
