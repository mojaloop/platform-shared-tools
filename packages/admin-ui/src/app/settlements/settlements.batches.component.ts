import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {ISettlementBatch, ISettlementBatchTransfer} from "@mojaloop/settlements-bc-public-types-lib";
import * as uuid from "uuid";
import {ActivatedRoute, Router} from "@angular/router";

const DEFAULT_TIME_FILTER_HOURS = 8;

@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.batches.component.html'
})
export class SettlementsBatchesComponent implements OnInit, OnDestroy {
	readonly ALL_STR_ID = "(All)";
	batches: BehaviorSubject<ISettlementBatch[]> = new BehaviorSubject<ISettlementBatch[]>([]);
	batchesSubs?: Subscription;

	batchTransfers: BehaviorSubject<ISettlementBatchTransfer[]> = new BehaviorSubject<ISettlementBatchTransfer[]>([]);
	batchTransfersSubs?: Subscription;


	batchSelPrefix = "batchSel_";
	selectedBatchIds: string[] = [];

	public criteriaCurrencyCode: string = this.ALL_STR_ID;
	public criteriaSettlementModel: string = this.ALL_STR_ID;
	public criteriaFromDate = "";
	public criteriaToDate = ""
	public criteriaBatchId = "";
	public criteriaIncludeSettled = false;

	constructor(private _router: Router, private _settlementsService: SettlementsService, private _messageService: MessageService, private _route: ActivatedRoute) {
		this.criteriaFromDate = new Date(Date.now() - DEFAULT_TIME_FILTER_HOURS * 60 * 60 * 1000).toISOString()
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length-8); // remove Z, ms and secs

		this.criteriaToDate = new Date(Date.now() + DEFAULT_TIME_FILTER_HOURS * 60 * 60 * 1000 ).toISOString()
		this.criteriaToDate = this.criteriaToDate.substring(0, this.criteriaToDate.length-8); // remove Z, ms and secs
	}

	ngOnInit(): void {
		console.log("SettlementsBatchesComponent ngOnInit");

		const batchId = this._route.snapshot.queryParamMap.get("batchId");
		if(batchId) this.criteriaBatchId = batchId;
		const currencyCode = this._route.snapshot.queryParamMap.get("currencyCode");
		if(currencyCode) this.criteriaCurrencyCode = currencyCode;

		setTimeout(()=>{
			this.applyCriteria();
		}, 10);

	}

	applyCriteria(){
		const criteriaModel = (document.getElementById("criteriaSettlementModel") as HTMLSelectElement).value;

		const criteriaCurrencyCodeElemVal = (document.getElementById("criteriaCurrencyCode") as HTMLSelectElement).value;
		const criteriaCurrencyCodes = criteriaCurrencyCodeElemVal != this.ALL_STR_ID ? [criteriaCurrencyCodeElemVal] : [];

		const criteriaBatchStateElemVal = (document.getElementById("criteriaBatchState") as HTMLSelectElement).value;
		const criteriaBatchStates = criteriaBatchStateElemVal != this.ALL_STR_ID ? [criteriaBatchStateElemVal] : [];

		const criteriaFromStr = (document.getElementById("criteriaFromDate") as HTMLInputElement).value;
		const criteriaFrom = new Date(criteriaFromStr);
		const criteriaToStr = (document.getElementById("criteriaToDate") as HTMLInputElement).value;
		const criteriaTo = new Date(criteriaToStr);



		const criteriaBatchId = (document.getElementById("criteriaBatchId") as HTMLInputElement).value;

		this.batchesSubs = this._settlementsService.getBatchesByCriteria(
			criteriaFrom.valueOf(), criteriaTo.valueOf(),
			criteriaModel, criteriaCurrencyCodes, criteriaBatchStates
		).subscribe(list => {
			const filtered = list.filter(value => {
				if(criteriaBatchId && value.id.toUpperCase() !==criteriaBatchId.toUpperCase())
					return false;

				return true;
			});


			this.batches.next(filtered);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	createDynamicMatrix(){
		const criteriaModel = (document.getElementById("criteriaSettlementModel") as HTMLSelectElement).value;

		const criteriaFromStr = (document.getElementById("criteriaFromDate") as HTMLInputElement).value;
		const criteriaFrom = new Date(criteriaFromStr).valueOf();
		const criteriaToStr = (document.getElementById("criteriaToDate") as HTMLInputElement).value;
		const criteriaTo = new Date(criteriaToStr).valueOf();

		const criteriaCurrencyCodeElemVal = (document.getElementById("criteriaCurrencyCode") as HTMLSelectElement).value;
		const criteriaCurrencyCodes = criteriaCurrencyCodeElemVal != this.ALL_STR_ID ? [criteriaCurrencyCodeElemVal] : [];

	/*	const openBatches = (this.batches.value || []).filter(value => !value.);
		if(openBatches.length<=0){
			if (!confirm("The current search found no open batches, are you sure you want to create a settlement matrix with these criteria?")) return;
		}
*/
		this._settlementsService.createDynamicMatrix(
			uuid.v4(),
			criteriaModel,
			criteriaCurrencyCodes,
			criteriaFrom,
			criteriaTo
		).subscribe(matrixId => {
			if(!matrixId)
				throw new Error("error saving matrix");

			this._messageService.addSuccess("Matrix creation request accepted");

			this._router.navigateByUrl(`/settlements/matrix/${matrixId}`);
		});

	}


	createStaticMatrix() {
		if(this.selectedBatchIds.length<=0){
			if (!confirm("The current search found no batches, are you sure you want to create an empty static settlement matrix?")) return;
		}
		this._settlementsService.createStaticMatrix(
			uuid.v4(),
			this.selectedBatchIds
		).subscribe(matrixId => {
			if (!matrixId)
				throw new Error("error saving matrix");

			this._messageService.addSuccess("Matrix creation request accepted");

			this._router.navigateByUrl(`/settlements/matrix/${matrixId}`);
		});

	}


	selectBatch(batchId:string){
		this.batchTransfersSubs = this._settlementsService.getTransfersByBatch(batchId).subscribe(list => {
			console.log("SettlementsBatchesComponent ngOnInit - got transfers By getTransfersByBatch");

			this.batchTransfers.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	batchSelectionChanged(event:any){
		console.log("Clicked, new value = " + event.checked);

		const batchId:string = (event.target.id as string).replace(this.batchSelPrefix, "");

		if(event.target.checked){
			if(!this.selectedBatchIds.includes(batchId))
				this.selectedBatchIds.push(batchId);
		}else{
			if (this.selectedBatchIds.includes(batchId))
				this.selectedBatchIds = this.selectedBatchIds.filter(item => item!=batchId)
		}
	}

	ngOnDestroy() {
		if (this.batchesSubs) {
			this.batchesSubs.unsubscribe();
		}
		if (this.batchTransfersSubs) {
			this.batchTransfersSubs.unsubscribe();
		}
	}
}
