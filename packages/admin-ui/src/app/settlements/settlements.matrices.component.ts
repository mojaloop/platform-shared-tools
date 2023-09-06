import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {
	ISettlementBatch,
	ISettlementBatchTransfer,
	ISettlementMatrix
} from "@mojaloop/settlements-bc-public-types-lib";
import {ActivatedRoute} from "@angular/router";



@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.matrices.component.html'
})
export class SettlementsMatricesComponent implements OnInit, OnDestroy {
	private _matrixId: string | null = null;
	matrices: BehaviorSubject<ISettlementMatrix[]> = new BehaviorSubject<ISettlementMatrix[]>([]);
	matrixSubs?: Subscription;

	constructor(private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		console.log("SettlementsMatricesComponent ngOnInit");

		this._fetchMatrices();
	}

	private async _fetchMatrices(state?: string):Promise<void> {
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
