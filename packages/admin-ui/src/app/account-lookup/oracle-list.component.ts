import { Component, OnInit } from '@angular/core';

import {BehaviorSubject, Subscription} from "rxjs";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Oracle} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-lookup-oracle-list',
  templateUrl: './oracle-list.component.html'
})
export class AccountLookupOracleListComponent implements OnInit {
  registeredOracles: BehaviorSubject<Oracle[]> = new BehaviorSubject<Oracle[]>([]);
  registeredOraclesSubs?:Subscription;

  constructor(private _router:Router, private _accountLookUpService:AccountLookupService, private _messageService: MessageService) { }

  ngOnInit(): void {
    console.log("AccountLookupComponent ngOnInit");
    this.getOracles();
  }

  healthCheck(oracleId:string){
    this._accountLookUpService.healthCheck(oracleId).subscribe((result) => {
      this._messageService.addSuccess("Health check successful");
    }
    , error => {
      if (error && error instanceof UnauthorizedError) {
        this._messageService.addError(error.message);
      }
      this._messageService.addError("Health check failed");
    });
  }

  removeOracle(oracleId:string){
    if (!confirm("Are you sure you want to remove this oracle?")) return;

    this._accountLookUpService.deleteOracle(oracleId).subscribe(() => {
      this.getOracles();
      this._messageService.addSuccess("Oracle removed");
    }, error => {
      if (error) {
        this._messageService.addError(error.message);
      }
      else{
        this._messageService.addError("Error deleting oracle");
      }
    });
  }

  private getOracles() {
    this.registeredOraclesSubs = this._accountLookUpService.getRegisteredOracles().subscribe((list) => {
      this.registeredOracles.next(list);
    }, error => {
      if (error && error instanceof UnauthorizedError) {
        this._messageService.addError(error.message);
      }
      this.registeredOracles.next([]);
    });
  }
}
