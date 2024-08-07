import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {
	ISettlementBatchTransfer,
} from "@mojaloop/settlements-bc-public-types-lib";
import {ActivatedRoute} from "@angular/router";
import {paginate, PaginateResult, formatCommaSeparator} from "../_utils";


@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.transfers.component.html'
})
export class SettlementsTransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<ISettlementBatchTransfer[]> = new BehaviorSubject<ISettlementBatchTransfer[]>([]);
	transfersSub?: Subscription;

	transferId: string | null = null;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	formatCommaSeparator = formatCommaSeparator;

	constructor(private _route: ActivatedRoute, private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		console.log("SettlementsTransfersComponent ngOnInit");

		this.transferId = this._route.snapshot.queryParamMap.get('transferId');

		this._fetchTransfers();
	}

	_fetchTransfers(pageIndex?: number, pageSize?: number): Promise<void> {
		// For pagination
		if (pageIndex == null) {
			const pageIndexElem = document.getElementById("pageIndex") as HTMLSelectElement;
			pageIndex = parseInt(pageIndexElem?.value ?? 0);
		}
		if (pageSize == null) {
			const pageSizeElem = document.getElementById("pageSize") as HTMLSelectElement;
			pageSize = parseInt(pageSizeElem?.value ?? 10);
		}

		return new Promise(resolve => {
			this._settlementsService.getAllTransfers(this.transferId, pageIndex, pageSize).subscribe(transfers => {
				this.transfers.next(transfers.items);
				// Do pagination
				const paginateResult = paginate(transfers.pageIndex, transfers.totalPages);
				if(paginateResult) paginateResult.pageSize = pageSize;
				this.paginateResult.next(paginateResult);
				
				resolve();
			}, error => {
				if (error && error instanceof UnauthorizedError) {
					this._messageService.addError(error.message);
				}
			});
		});
	}


	ngOnDestroy() {
		if (this.transfersSub) {
			this.transfersSub.unsubscribe();
		}
	}
}
