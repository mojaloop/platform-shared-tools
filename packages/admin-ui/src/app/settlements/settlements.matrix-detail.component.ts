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
import { formatCommaSeparator } from "../_utils";
import moment from "moment";

@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.matrix-detail.component.html'
})
export class SettlementsMatrixDetailComponent implements OnInit, OnDestroy {
	private _matrixId: string | null = null;
	private _live: boolean = false;
	private _reloadRequested: boolean = false;
	private _reloadCount = 0;

	// canLock: Boolean = false;
	// canSettle: Boolean = false;
	//
	canLock: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	canSettle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	canDispute: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	canClose: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


	matrix: BehaviorSubject<ISettlementMatrix | null> = new BehaviorSubject<ISettlementMatrix | null>(null);
	matrixSubs?: Subscription;

	transfers: BehaviorSubject<ISettlementBatchTransfer[]> = new BehaviorSubject<ISettlementBatchTransfer[]>([]);
	excelFileUrl: any;

	formatCommaSeparator = formatCommaSeparator;
	currentLocalTimeZoneOffset: string = "";

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
		this.currentLocalTimeZoneOffset = this.getTimezoneOffset();
	}

	getTimezoneOffset(): string {
		const offset = moment().format('Z'); // e.g., +05:30 or -04:00
		return `UTC${offset}`;
	}

	private async _fetchMatrix(id: string): Promise<void> {

		this._settlementsService.getMatrix(id).subscribe(matrix => {
			this.matrix.next(matrix);

			if (this._live && !matrix || matrix?.state === "BUSY") {
				if (this._reloadCount > 30) return;

				this._reloadCount++;
				this._reloadRequested = true;
				setTimeout(() => {
					this._fetchMatrix(id);
				}, 1000);
				return;
			} else if (this._live && this._reloadRequested) {
				this._messageService.addSuccess("Matrix reloaded");
			}

			if (matrix) {
				// check possible actions
				let includesNotDisputed = false;
				let includesNotClosed = false;
				let includesAwaitingSettlement = false;

				matrix.batches.forEach(batch => {
					if (batch.state !== "DISPUTED") includesNotDisputed = true;
					if (batch.state !== "CLOSED") includesNotClosed = true;
					if (batch.state === "AWAITING_SETTLEMENT") includesAwaitingSettlement = true;
				});
				this.canLock.next(includesNotDisputed);
				this.canSettle.next(includesAwaitingSettlement);
				this.canDispute.next(includesNotDisputed);
				this.canClose.next(includesNotClosed);


				this._settlementsService.getTransfersByMatrixId(matrix.id).subscribe(transfers => {
					this.transfers.next(transfers);
				});
			}
		});

	}

	refresh() {
		this._fetchMatrix(this._matrixId!);
	}

	recalculate() {
		this._settlementsService.recalculateMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	dispute() {
		this._settlementsService.disputeMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	close() {
		this._settlementsService.closeMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	settle() {
		this._settlementsService.settleMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	export() {
		this._settlementsService.exportSettlementMatrix(this._matrixId!, this.currentLocalTimeZoneOffset).subscribe(
			(data) => {
				const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
				this.excelFileUrl = window.URL.createObjectURL(blob);

				// Programmatically trigger the download link's click event
				const downloadLink = document.createElement('a');
				downloadLink.href = this.excelFileUrl;
				downloadLink.download = 'settlementInitiation.xlsx';
				downloadLink.style.display = 'none';
				document.body.appendChild(downloadLink);
				downloadLink.click();
				document.body.removeChild(downloadLink);
			},
			(error) => {
				console.error(error);
				throw error;
			}
		);
	}

	lock() {
		this._settlementsService.lockMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	unlock() {
		this._settlementsService.unlockMatrix(this._matrixId!).subscribe(value => {
			this.refresh();
		}, error => {
			throw error;
		});
	}

	async copyIdToClipboard() {
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
