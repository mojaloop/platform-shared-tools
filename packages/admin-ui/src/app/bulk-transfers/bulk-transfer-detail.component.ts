import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {NgbModal, NgbNav} from "@ng-bootstrap/ng-bootstrap";
import {BulkTransfer} from '../_services_and_types/bulk_transfer_types';
import {BulkTransfersService} from '../_services_and_types/bulk-transfers.service';
import { PaginateResult } from "../_utils";


@Component({
	selector: 'app-bulk-transfer-detail',
	templateUrl: './bulk-transfer-detail.component.html'
})
export class BulkTransferDetailComponent implements OnInit {
	private _bulkTransferId: string | null = null;
	public bulkTransfer: BehaviorSubject<BulkTransfer | null> = new BehaviorSubject<BulkTransfer | null>(null);
	public allTransfers: BehaviorSubject<Transfer[] | null> = new BehaviorSubject<Transfer[] | null>(null);
	public transfersNotProcessed: BehaviorSubject<Transfer[] | null> = new BehaviorSubject<Transfer[] | null>(null);

	private _live: boolean = false;
	private _reloadRequested: boolean = false;

	private _reloadCount = 0;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	@ViewChild("nav") // Get a reference to the ngbNav
	navBar!: NgbNav;

	constructor(private _route: ActivatedRoute, private _bulkTransfersSvc: BulkTransfersService, private _transfersSvc: TransfersService, private _messageService: MessageService, private _modalService: NgbModal) {

	}

	async ngOnInit(): Promise<void> {
		console.log(this._route.snapshot.routeConfig?.path);
		if (this._route.snapshot.routeConfig?.path === this._bulkTransfersSvc.hubId) {
			this._bulkTransferId = this._bulkTransfersSvc.hubId;
		} else {
			this._bulkTransferId = this._route.snapshot.paramMap.get('id');
		}

		if (!this._bulkTransferId) {
			throw new Error("invalid bulkTransfer id");
		}

		await this._fetchBulkTransfer(this._bulkTransferId);

		await this._fetchAllTransfers(this._bulkTransferId);

		console.log(this._route.snapshot.routeConfig?.path);

		this._live = this._route.snapshot.queryParamMap.has('live');

		this._route.params.subscribe(params => {
			this._bulkTransferId = params['id'];

			if (this._bulkTransferId) {
				this._fetchBulkTransfer(this._bulkTransferId);
			} else {
				throw new Error("invalid parameter");
			}
		});
	}

	private async _fetchBulkTransfer(bulkTransferId: string): Promise<void> {
		this._bulkTransfersSvc.getBulkTransfer(bulkTransferId).subscribe(bulkTransfer => {
			this.bulkTransfer.next(bulkTransfer);

			if (this._live && !bulkTransfer || !(bulkTransfer?.status === "REJECTED" || bulkTransfer?.status === "ACCEPTED")) {

				if (this._reloadCount > 30) return;

				this._reloadCount++;
				this._reloadRequested = true;
				setTimeout(() => {
					this._reloadCount++;
					this._fetchBulkTransfer(bulkTransferId);
					this._fetchAllTransfers(bulkTransferId);
				}, 1000);

			} else if (this._live && this._reloadRequested) {
				this._messageService.addSuccess("Transfer reloaded");
			}
		});
	}

	private async _fetchAllTransfers(bulkTransferId: string): Promise<void> {
		return new Promise(resolve => {
			this._transfersSvc.search(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				bulkTransferId,
				undefined,
				undefined
			).subscribe(transfersSearchResult => {
				this.allTransfers.next(transfersSearchResult.items);
				resolve();
			});
		});
	}

	tabChange(e: any) {
		console.log(`Tab changed to ${e.nextId}`);
	}

	async copyTransferIdToClipboard() {
		await navigator.clipboard.writeText(this.bulkTransfer.value!.bulkTransferId || "");
	}
}
