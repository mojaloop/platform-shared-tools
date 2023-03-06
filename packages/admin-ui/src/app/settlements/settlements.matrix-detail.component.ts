import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {
	ISettlementBatch,
	ISettlementBatchTransfer,
	ISettlementMatrix
} from "src/app/_services_and_types/settlements_types";
import {ActivatedRoute} from "@angular/router";



@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.matrix-detail.component.html'
})
export class SettlementsMatrixDetailComponent implements OnInit, OnDestroy {
	private _matrixId: string | null = null;
	matrix: BehaviorSubject<ISettlementMatrix | null> = new BehaviorSubject<ISettlementMatrix|null>(null);
	matrixSubs?: Subscription;

	constructor(private _route: ActivatedRoute, private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		console.log("SettlementsMatrixDetailComponent ngOnInit");
		console.log(this._route.snapshot.routeConfig?.path);

		this._matrixId = this._route.snapshot.paramMap.get('id');

		if (!this._matrixId) {
			throw new Error("invalid matrix id");
		}

		this._fetchMatrix(this._matrixId);
	}
	private async _fetchMatrix(id: string):Promise<void> {
		return new Promise(resolve => {
			this._settlementsService.getMatrix(id).subscribe(matrix => {
				this.matrix.next(matrix);
				resolve();
			});
		});

	}

	refresh(){
		this._fetchMatrix(this._matrixId!);
	}

	recalculate(newBatches:boolean){
		this._settlementsService.recalculateMatrix(this._matrixId!, newBatches).subscribe(value => {
			this._fetchMatrix(value);
		},error => {
			throw error;
		});
	}

	close(){
		this._settlementsService.closeMatrix(this._matrixId!).subscribe(value => {
			this._fetchMatrix(value);
		},error => {
			throw error;
		});
	}

	async copyIdToClipboard(){
		await navigator.clipboard.writeText(this._matrixId || "");
	}


	tabChange(e: any) {
		console.log(`Tab changed to ${e.nextId}`);
	}

	ngOnDestroy() {
		if (this.matrixSubs) {
			this.matrixSubs.unsubscribe();
		}
	}
}
