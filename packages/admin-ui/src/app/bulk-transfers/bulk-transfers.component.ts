import {Component, OnDestroy, OnInit} from "@angular/core";
import {BulkTransfersService} from "src/app/_services_and_types/bulk-transfers.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {BulkTransfer} from '../_services_and_types/bulk_transfer_types';
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: 'app-bulk-transfers',
	templateUrl: './bulk-transfers.component.html'
})
export class BulkTransfersComponent implements OnInit, OnDestroy {
	bulkTransfers: BehaviorSubject<BulkTransfer[]> = new BehaviorSubject<BulkTransfer[]>([]);
	bulkTransfersSubs?: Subscription;

	constructor(private _bulkTransfersSvc: BulkTransfersService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("TransfersComponent ngOnInit");

		this.bulkTransfersSubs = this._bulkTransfersSvc.getAllTransfers().subscribe((list) => {
			console.log("TransfersComponent ngOnInit - got getAllTransfers");

			this.bulkTransfers.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});


	}

	ngOnDestroy() {
		if (this.bulkTransfersSubs) {
			this.bulkTransfersSubs.unsubscribe();
		}

	}
}
