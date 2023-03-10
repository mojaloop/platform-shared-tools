import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {BehaviorSubject} from "rxjs";
import {ISettlementBatchTransfer} from "src/app/_services_and_types/settlements_types";
import {SettlementsService} from "src/app/_services_and_types/settlements.service";
import {MessageService} from "src/app/_services_and_types/message.service";


@Component({
  selector: 'app-transfer-detail',
  templateUrl: './transfer-detail.component.html'
})


export class TransferDetailComponent implements OnInit {
  private _transferId: string | null = null;
  private _live: boolean = false;
	private _reloadRequested: boolean = false;
  public transfer: BehaviorSubject<Transfer | null> = new BehaviorSubject<Transfer | null>(null);
  settlementTransfer: BehaviorSubject<ISettlementBatchTransfer | null> = new BehaviorSubject<ISettlementBatchTransfer | null>(null);

	private _reloadCount = 0;

  constructor(private _route: ActivatedRoute, private _transfersSvc: TransfersService, private _settlementsService: SettlementsService,private _messageService: MessageService) {

  }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);

    this._transferId = this._route.snapshot.paramMap.get('id');
	this._live = this._route.snapshot.queryParamMap.has('live');

    if (!this._transferId) {
      throw new Error("invalid transfer id");
    }

	this._fetchTransfer(this._transferId);
  }

  private async _fetchTransfer(id: string):Promise<void> {
	  this._transfersSvc.getTransfer(id).subscribe(transfer => {
		  this.transfer.next(transfer);

		  if(this._live && !transfer ||	 !(transfer?.transferState === "COMMITTED" ||transfer?.transferState === "REJECTED" ||  transfer?.transferState === "ABORTED")){
			  if(this._reloadCount > 30)  return;

			  this._reloadCount++;
			  this._reloadRequested = true;
			  setTimeout(()=>{
				  this._fetchTransfer(id);
			  }, 1000);

		  }else if(this._live && this._reloadRequested){
			  this._messageService.addSuccess("Quote reloaded");
		  }

		  this._settlementsService.getTransfersByTransferId(id!).subscribe(value => {
			  this.settlementTransfer.next(value);
		  });
	  });
  }

  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }

  async copyTransferIdToClipboard(){
    await navigator.clipboard.writeText(this.transfer.value!.transferId || "");
  }
}
