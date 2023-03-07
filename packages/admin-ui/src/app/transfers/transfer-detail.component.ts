import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Transfer} from "src/app/_services_and_types/transfer_types";
import {TransfersService} from "src/app/_services_and_types/transfers.service";
import {BehaviorSubject} from "rxjs";


@Component({
  selector: 'app-transfer-detail',
  templateUrl: './transfer-detail.component.html'
})
export class TransferDetailComponent implements OnInit {
  private _transferId: string | null = null;
  public transfer: BehaviorSubject<Transfer | null> = new BehaviorSubject<Transfer | null>(null);

  constructor(private _route: ActivatedRoute, private _transfersSvc: TransfersService) {

  }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);

    this._transferId = this._route.snapshot.paramMap.get('id');

    if (!this._transferId) {
      throw new Error("invalid transfer id");
    }

	  this._transfersSvc.getTransfer(this._transferId).subscribe(transfer => {
		  this.transfer.next(transfer);
	  });
  }


  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }

  async copyTransferIdToClipboard(){
    await navigator.clipboard.writeText(this.transfer.value!.transferId || "");
  }
}
