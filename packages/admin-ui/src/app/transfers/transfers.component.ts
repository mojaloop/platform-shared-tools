import {Component, OnDestroy, OnInit} from '@angular/core';
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: 'app-transfers',
	templateUrl: './transfers.component.html'
})
export class TransfersComponent implements OnInit, OnDestroy {
	transfers: BehaviorSubject<Transfer[]> = new BehaviorSubject<Transfer[]>([]);
	transfersSubs?: Subscription;


	constructor(private _transfersSvc: TransfersService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("TransfersComponent ngOnInit");

		this.search();
	}

	search() {

		const elemFilterStateVal = (document.getElementById("filterState") as HTMLSelectElement).value;
		const elemFilterCurrencyCodeVal = (document.getElementById("filterCurrency") as HTMLSelectElement).value;
		const elemFilterStartDateStr = (document.getElementById("filterStartDate") as HTMLInputElement).value;
		const filterStartDate = elemFilterStartDateStr ? new Date(elemFilterStartDateStr).valueOf() : undefined;
		const elemFilterEndDateStr = (document.getElementById("filterEndDate") as HTMLInputElement).value;
		const filterEndDate = elemFilterEndDateStr? new Date(elemFilterEndDateStr).valueOf() : undefined;
		const filterId = (document.getElementById("filterId") as HTMLInputElement).value || undefined;

		const filterState = elemFilterStateVal.toUpperCase()==="ALL" ? undefined : elemFilterStateVal;
		const filterCurrencyCode = elemFilterCurrencyCodeVal.toUpperCase()==="ALL" ? undefined : elemFilterCurrencyCodeVal;

		this.transfersSubs = this._transfersSvc.searchTransfers(
			filterState, filterCurrencyCode, filterStartDate,
			filterEndDate, filterId
		).subscribe((list) => {
			console.log("TransfersComponent search - got searchTransfers");

			this.transfers.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.transfersSubs) {
			this.transfersSubs.unsubscribe();
		}

	}
}
