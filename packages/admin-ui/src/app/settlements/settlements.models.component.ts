import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {MessageService} from "src/app/_services_and_types/message.service";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {
	ISettlementBatch,
	ISettlementBatchTransfer, ISettlementConfig,
	ISettlementMatrix
} from "@mojaloop/settlements-bc-public-types-lib";
import {ActivatedRoute} from "@angular/router";


@Component({
	selector: 'app-settlements',
	templateUrl: './settlements.models.component.html'
})
export class SettlementsModelsComponent implements OnInit {
	models: BehaviorSubject<ISettlementConfig[]> = new BehaviorSubject<ISettlementConfig[]>([]);

	constructor(private _settlementsService: SettlementsService, private _messageService: MessageService) {

	}

	ngOnInit(): void {
		console.log("SettlementsModelsComponent ngOnInit");
		this._fetchModels();
	}

	private async _fetchModels(): Promise<void> {
		return new Promise(resolve => {
			this._settlementsService.getAllModels().subscribe(matrix => {
				this.models.next(matrix);
				resolve();
			}, error => {
				if (error && error instanceof UnauthorizedError) {
					this._messageService.addError(error.message);
				}
			});
		});

	}


	ngOnDestroy() {
		if (this.models) {
			this.models.unsubscribe();
		}
	}

}
