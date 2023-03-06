import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {ISettlementBatch, ISettlementBatchTransfer} from "src/app/_services_and_types/settlements_types";
import * as uuid from "uuid";
import {ActivatedRoute, Router} from "@angular/router";


@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.batches.component.html'
})
export class SettlementsBatchesComponent implements OnInit, OnDestroy {
	batches: BehaviorSubject<ISettlementBatch[]> = new BehaviorSubject<ISettlementBatch[]>([]);
	batchesSubs?: Subscription;

	batchTransfers: BehaviorSubject<ISettlementBatchTransfer[]> = new BehaviorSubject<ISettlementBatchTransfer[]>([]);
	batchTransfersSubs?: Subscription;

	public criteriaCurrencyCode: string = "USD";
	public criteriaSettlementModel: string = "DEFAULT";
	public criteriaFromDate = "";
	public criteriaToDate = ""

	constructor(private _router: Router, private _settlementsService: SettlementsService, private _messageService: MessageService) {
		this.criteriaFromDate = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
		this.criteriaFromDate = this.criteriaFromDate.substring(0, this.criteriaFromDate.length-8); // remove Z, ms and secs

		this.criteriaToDate = new Date(Date.now() + 6 * 60 * 60 * 1000 ).toISOString()
		this.criteriaToDate = this.criteriaToDate.substring(0, this.criteriaToDate.length-8); // remove Z, ms and secs
	}

	ngOnInit(): void {
		console.log("SettlementsBatchesComponent ngOnInit");

		this.batchesSubs = this._settlementsService.getBatchesByCriteria(
			this.criteriaSettlementModel,
			this.criteriaCurrencyCode,
			new Date(this.criteriaFromDate).valueOf(),
			new Date(this.criteriaToDate).valueOf(),
		).subscribe(list => {
			console.log("SettlementsBatchesComponent ngOnInit - got batches By criteria");

			this.batches.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

		/*this.batchTransfersSubs = this._settlementsService.getTransfersByBatchName("nonExistent").subscribe(list => {
			console.log("SettlementsBatchesComponent ngOnInit - got transfers By batchname");

			this.batchTransfers.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});*/
	}

	applyCriteria(){
		const criteriaModel = (document.getElementById("criteriaSettlementModel") as HTMLSelectElement).value;
		const criteriaCurrencyCode = (document.getElementById("criteriaCurrencyCode") as HTMLSelectElement).value;
		const criteriaFromStr = (document.getElementById("criteriaFromDate") as HTMLInputElement).value;
		const criteriaFrom = new Date(criteriaFromStr);
		const criteriaToStr = (document.getElementById("criteriaToDate") as HTMLInputElement).value;
		const criteriaTo = new Date(criteriaToStr);

		this.batchesSubs = this._settlementsService.getBatchesByCriteria(
			criteriaModel, criteriaCurrencyCode,
			criteriaFrom.valueOf(), criteriaTo.valueOf()
		).subscribe(list => {
			this.batches.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	createMatrix(){

		const criteriaModel = (document.getElementById("criteriaSettlementModel") as HTMLSelectElement).value;
		const criteriaCurrencyCode = (document.getElementById("criteriaCurrencyCode") as HTMLSelectElement).value;
		const criteriaFromStr = (document.getElementById("criteriaFromDate") as HTMLInputElement).value;
		const criteriaFrom = new Date(criteriaFromStr).valueOf();
		const criteriaToStr = (document.getElementById("criteriaToDate") as HTMLInputElement).value;
		const criteriaTo = new Date(criteriaToStr).valueOf();

		const openBatches = (this.batches.value || []).filter(value => !value.isClosed);
		if(openBatches.length<=0){
			if (!confirm("The current search found no open batches, are you sure you want to create a settlement matrix with these criteria?")) return;
		}

		this._settlementsService.createMatrix(
			uuid.v4(),
			criteriaModel,
			criteriaCurrencyCode,
			criteriaFrom,
			criteriaTo
		).subscribe(matrixId => {
			if(!matrixId)
				throw new Error("error saving matrix");

			this._messageService.addSuccess("Matrix creation request accepted");

			// wait for the record to be created
			setTimeout(()=>{
				this._router.navigateByUrl(`/settlements/matrix/${matrixId}`);
			}, 500);

		});
		// this.batchesSubs = this._settlementsService.(
		// 	criteriaModel, criteriaCurrencyCode,
		// 	criteriaFrom.valueOf(), criteriaTo.valueOf()
		// ).subscribe(list => {
		// 	this.batches.next(list);
		// }, error => {
		// 	if (error && error instanceof UnauthorizedError) {
		// 		this._messageService.addError(error.message);
		// 	}
		// });
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

	ngOnDestroy() {
		if (this.batchesSubs) {
			this.batchesSubs.unsubscribe();
		}
		if (this.batchTransfersSubs) {
			this.batchTransfersSubs.unsubscribe();
		}
	}
}
