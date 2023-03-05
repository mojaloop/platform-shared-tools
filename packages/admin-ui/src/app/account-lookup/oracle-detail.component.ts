import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import {MessageService} from "src/app/_services_and_types/message.service";
import {Oracle} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {FormGroup} from "@angular/forms";
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UnauthorizedError } from '../_services_and_types/errors';


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

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _accountLookUpService:AccountLookupService, private _messageService: MessageService) { }

  async ngOnInit(): Promise<void> {
    console.log(this._activatedRoute.snapshot.routeConfig?.path);
    this._oracleId = this._activatedRoute.snapshot.paramMap.get('id');

    if (!this._oracleId) {
      throw new Error("invalid oracle id");
    }

    this._fetchOracle(this._oracleId);
  }

  private async _fetchOracle(id: string):Promise<void> {
    return new Promise(resolve => {
      this._accountLookUpService.getRegisteredOracleById(id).subscribe(oracle => {
        this.oracle.next(oracle);
        resolve();
      });
    });

  }

  back(){
    history.back();
  }

  async copyOracleIdToClipboard(){
    await navigator.clipboard.writeText(this.oracle.value!.id || "");
  }

  healthCheck(oracle:any){
    const oracleId = oracle.value.id;

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

  removeOracle(oracle:any){
    const oracleId = oracle.value.id;

    if (!confirm("Are you sure you want to remove this oracle?")) return;

    this._accountLookUpService.deleteOracle(oracleId).subscribe(() => {
      this._router.navigateByUrl('/account-lookup-oracles')
      
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
}
