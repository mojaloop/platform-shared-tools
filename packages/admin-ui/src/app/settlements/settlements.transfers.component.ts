import {Component, OnDestroy, OnInit} from "@angular/core";
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
	templateUrl: './settlements.transfers.component.html'
})
export class SettlementsTransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<ISettlementBatchTransfer[]> = new BehaviorSubject<ISettlementBatchTransfer[]>([]);
	transfersSub?: Subscription;

	transferId: string | null = null;

	constructor(private _route: ActivatedRoute, private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		console.log("SettlementsTransfersComponent ngOnInit");

		this.transferId = this._route.snapshot.queryParamMap.get('transferId');

		this._fetchTransfers();
	}

	private async _fetchTransfers(state?: string): Promise<void> {
		return new Promise(resolve => {
			this._settlementsService.getAllTransfers().subscribe(transfers => {
				if (this.transferId) {
					transfers = transfers.filter(value => value.transferId === this.transferId);
				}

				this.transfers.next(transfers);
				resolve();
			});
		});

	}


	ngOnDestroy() {
		if (this.transfersSub) {
			this.transfersSub.unsubscribe();
		}
	}
}
