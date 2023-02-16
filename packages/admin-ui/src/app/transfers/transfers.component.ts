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
  transfersSubs?:Subscription;

  constructor(private _transfersSvc:TransfersService, private _messageService: MessageService) { }

  ngOnInit(): void {
    console.log("TransfersComponent ngOnInit");

    this.transfersSubs = this._transfersSvc.getAllTransfers().subscribe((list) => {
      console.log("TransfersComponent ngOnInit - got getAllTransfers");

      this.transfers.next(list);
    }, error => {
      if(error && error instanceof UnauthorizedError){
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
