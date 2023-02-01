import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import {MessageService} from "src/app/_services_and_types/message.service";
import {Oracle} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {FormGroup} from "@angular/forms";
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-account-lookup-oracle-edit',
  templateUrl: './oracle-detail.component.html'
})
export class AccountLookupOracleDetailComponent implements OnInit {
  public addedOracleEmitter = new EventEmitter();
  @Input() fromParent!:Oracle;
  public viewMode = false;
  public registerMode = false;
  public form!: FormGroup;
  private _oracleId: string | null = null;
  oracle: BehaviorSubject<Oracle | null> = new BehaviorSubject<Oracle | null>(null);
  registerError: string = "";
  registerSuccess!: boolean;

  constructor(private _route: ActivatedRoute, private _alSvc:AccountLookupService, private _messageService: MessageService) { }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);
    this._oracleId = this._route.snapshot.paramMap.get('id');

    if (!this._oracleId) {
      throw new Error("invalid oracle id");
    }

    this._fetchOracle(this._oracleId);
  }

  private async _fetchOracle(id: string):Promise<void> {
    return new Promise(resolve => {
      this._alSvc.getRegisteredOracleById(id).subscribe(oracle => {
        this.oracle.next(oracle);
        resolve();
      });
    });

  }

  back(){
    history.back();
  }
}
