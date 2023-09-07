import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "src/app/_services_and_types/message.service";
import * as uuid from "uuid";
import {
  IParticipantNetDebitCapChangeRequest,
  Participant,
  ParticipantAccount,
  ParticipantAccountChangeRequest,
  ParticipantFundsMovement,
  ParticipantFundsMovementDirection,
} from "src/app/_services_and_types/participant_types";
import { ParticipantsService } from "src/app/_services_and_types/participants.service";
import { BehaviorSubject } from "rxjs";
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalRef,
  NgbNav,
} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-participant-detail",
  templateUrl: "./participant-detail.component.html",
})
export class ParticipantDetailComponent implements OnInit {
  private _participantId: string | null = null;
  public participant: BehaviorSubject<Participant | null> =
    new BehaviorSubject<Participant | null>(null);

  endpointCreateModeEnabled = false;
  endpointEditModeEnabled = false;
  endpointEditingId: string = "";

  accountCreateModeEnabled = false;
  accountEditModeEnabled = false;
  newAccount: any;

  ndcCreateModeEnabled = false;
  ndcEditModeEnabled = false;
  newNDC: IParticipantNetDebitCapChangeRequest | null = null;

  @ViewChild("nav") // Get a reference to the ngbNav
  navBar!: NgbNav;
  @ViewChild("depositWithdrawalModal") // Get a reference to the depositModal
  depositWithdrawalModal!: NgbModal;
  depositWithdrawalModalRef?: NgbModalRef;
  depositWithdrawalModalMode!: ParticipantFundsMovementDirection;

  constructor(
    private _route: ActivatedRoute,
    private _participantsSvc: ParticipantsService,
    private _messageService: MessageService,
    private _modalService: NgbModal
  ) { }

  async ngOnInit(): Promise<void> {
    console.log(this._route.snapshot.routeConfig?.path);
    if (
      this._route.snapshot.routeConfig?.path === this._participantsSvc.hubId
    ) {
      this._participantId = this._participantsSvc.hubId;
    } else {
      this._participantId = this._route.snapshot.paramMap.get("id");
    }

    if (!this._participantId) {
      throw new Error("invalid participant id");
    }

    await this._fetchParticipant(this._participantId);
    this.updateAccounts();
  }

  private async _fetchParticipant(id: string): Promise<void> {
    return new Promise((resolve) => {
      this._participantsSvc.getParticipant(id).subscribe((participant) => {
        this.participant.next(participant);
        resolve();
      });
    });
  }

  tabChange(e: any) {
    if (this.editing) {
      e.preventDefault();
      console.log(`Tab changed to ${e.nextId} prevented`);
    } else {
      console.log(`Tab changed to ${e.nextId}`);
    }
  }

  // any editing going on this page?
  get editing(): boolean {
    return this.endpointCreateModeEnabled || this.endpointEditModeEnabled;
  }

  approve() {
    this._participantsSvc
      .approveParticipant(this.participant.value?.id!)
      .subscribe(
        (value) => {
          this._messageService.addSuccess("Participant Approved");
          this.ngOnInit();
        },
        (error) => {
          this._messageService.addError(error.message);
        }
      );
  }

  /*
   * Endpoints
   * */

  endpointStartEdit(id: string) {
    this.endpointEditModeEnabled = true;
    this.endpointEditingId = id;
    console.log(`endpointStartEdit id: ${id}`);
  }

  async endpointSaveEdit(id: string) {
    console.log("endpointSaveEdit() called");

    const endpointObj = this.participant.value?.participantEndpoints.find(
      (item) => item.id === id
    );

    if (!endpointObj) {
      throw new Error(
        `can't find endpoint with id: ${id} on endpointSaveEdit()`
      );
    }

    const typeElement: HTMLSelectElement | null = document.getElementById(
      `endpointType_${id}`
    ) as HTMLSelectElement;

    if (typeElement) {
      endpointObj.type = typeElement.value as "FSPIOP" | "ISO20022";
    } else {
      endpointObj.type = "FSPIOP"; // default
    }

    const protocolElement: HTMLSelectElement | null = document.getElementById(
      `endpointProtocol_${id}`
    ) as HTMLSelectElement;

    if (protocolElement) {
      endpointObj.protocol = protocolElement.value as "HTTPs/REST";
    } else {
      endpointObj.protocol = "HTTPs/REST"; // default
    }

    const valueElement: HTMLInputElement | null = document.getElementById(
      `endpointValue_${id}`
    ) as HTMLInputElement;
    if (protocolElement) {
      endpointObj.value = valueElement.value;
    } else {
      endpointObj.value = ""; // default
    }

    const complete = () => {
      this.endpointCreateModeEnabled = false;
      this.endpointEditModeEnabled = false;
      this.endpointEditingId = "";

      this._fetchParticipant(this.participant.value!.id);
    };

    if (this.endpointCreateModeEnabled) {
      this._participantsSvc
        .createEndpoint(this.participant.value!.id, endpointObj)
        .subscribe(
          (value) => {
            complete();
          },
          (error) => {
            this._messageService.addError(error);
          }
        );
    } else {
      this._participantsSvc
        .changeEndpoint(this.participant.value!.id, endpointObj)
        .subscribe(
          (value) => {
            complete();
          },
          (error) => {
            this._messageService.addError(error);
          }
        );
    }
  }

  endpointStopEdit() {
    if (this.endpointCreateModeEnabled) {
      this.participant.value?.participantEndpoints.pop();
    }
    this.endpointCreateModeEnabled = false;
    this.endpointEditModeEnabled = false;
    this.endpointEditingId = "";
  }

  endpointAddNew() {
    const newEndpoint = this._participantsSvc.createEmptyEndpoint();

    this.participant.value?.participantEndpoints.push(newEndpoint);
    this.endpointEditingId = newEndpoint.id;
    this.endpointCreateModeEnabled = true;
    this.endpointEditModeEnabled = true;
  }

  endpointRemote(id: string) {
    console.log("endpointSaveEdit() called");
    const endpointObj = this.participant.value?.participantEndpoints.find(
      (item) => item.id === id
    );
    if (!endpointObj) {
      throw new Error(`can't find endpoint with id: ${id} on endpointRemote()`);
    }

    if (!confirm("Are you sure you want to remove this endpoint?")) return;

    this._participantsSvc
      .removeEndpoint(this.participant.value!.id, endpointObj.id)
      .subscribe(
        (value) => {
          //this.participant.value!.participantEndpoints = this.participant.value!.participantEndpoints.filter(value => value.id!==id);
          this._fetchParticipant(this.participant.value!.id);
        },
        (error) => {
          this._messageService.addError(error);
        }
      );
  }

  /*
   * Accounts
   * */

  onEditAccountClick(account: ParticipantAccount): void {
    account.editing = true;
  }

  onCancelEditClick(account: ParticipantAccount): void {
    account.editing = false;
    this.accountCreateModeEnabled = false;
  }

  onAddAccountClick(): void {
    this.accountCreateModeEnabled = true;
    this.newAccount = this._participantsSvc.createEmptyAccount();
  }

  saveEditAccount(account: ParticipantAccount): void {
    // Implement logic to save changes to the account

    account.editing = false;

    let participantAccountChangeRequest: ParticipantAccountChangeRequest = {
      id: uuid.v4(),
      accountId: account.id,
      type: account.type,
      currencyCode: account.currencyCode,
      externalBankAccountId: account.externalBankAccountId,
      externalBankAccountName: account.externalBankAccountName,
    }

    // check overlaps
    if (this.accountCreateModeEnabled) {
      const duplicateAccount = this.participant.value?.participantAccounts.find(
        (item) =>
          item.type === account.type &&
          item.currencyCode === account.currencyCode
      );

      if (duplicateAccount) {
        this._messageService.addWarning(
          "Cannot add a second account of the same type and currency"
        );
        this.accountCreateModeEnabled = false;
        account.editing = false;
        return;
      }
    }

    this._participantsSvc
      .createAccount(this.participant.value!.id, participantAccountChangeRequest)
      .subscribe(
        (value) => {
          this._fetchParticipant(this.participant.value!.id);
          this.updateAccounts();
          this.accountCreateModeEnabled = false;
          this.accountEditModeEnabled = false;
          account.editing = false;

          this._messageService.addSuccess(
            "Account change request created!"
          );
          
        },
        (error) => {
          
          this._messageService.addError(error);
        }
      );
  }

  approveAccountChangeRequest(reqId: string) {
    this._participantsSvc
      .approveAccountChangeRequest(this.participant.value!.id, reqId)
      .subscribe(
        async () => {
          this._messageService.addSuccess("Successfully approved account change request.");

          await this._fetchParticipant(this.participant.value!.id);
        },
        (error) => {
          if (this.depositWithdrawalModalRef)
            this.depositWithdrawalModalRef!.close();
          this._messageService.addError(
            `Account changes request approval failed with: ${error}`
          );
        }
      );
  }

  rejectAccountChangeRequest(reqId: string) {
    this._messageService.addError("Not implemented (rejectAccountChangeRequest)");
  }


  /*  accountRemote(id: string) {
    console.log("accountSaveEdit() called");
    const accountObj = this.participant.value?.participantAccounts.find(item => item.id===id);
    if (!accountObj) {
      throw new Error(`can't find account with id: ${id} on accountRemote()`);
    }

    if (!confirm("Are you sure you want to remove this account?")) return;

    this._participantsSvc.removeAccount(this.participant.value!.id, accountObj.id).subscribe(value => {
        //this.participant.value!.participantaccounts = this.participant.value!.participantaccounts.filter(value => value.id!==id);
        this._fetchParticipant(this.participant.value!.id);
      }, error => {
        this._messageService.addError(error);
      }
    );
  }*/

  updateAccounts() {
    if (!this._participantId) {
      throw new Error("invalid participant id");
    }

    this._participantsSvc
      .getParticipantAccounts(this._participantId)
      .subscribe((accounts: ParticipantAccount[]) => {
        if (!accounts) return;

        //console.log(accounts);
        this.participant.value!.participantAccounts = accounts;
        this.participant.next(this.participant.value);
      });

    this.navBar.select("accounts");
  }

  createFundsMov(e: Event, direction: ParticipantFundsMovementDirection) {
    if (!this.depositWithdrawalModalRef) return;

    let valid = true;

    const depositAmountElem: HTMLInputElement = document.getElementById(
      "depositAmount"
    ) as HTMLInputElement;
    depositAmountElem.classList.remove("is-invalid");

    const amount = depositAmountElem.valueAsNumber; // guarantee it's a number
    if (!amount || amount < 0) {
      depositAmountElem.classList.add("is-invalid");
      valid = false;
    }
    const depositCurrencyCodeElem: HTMLSelectElement = document.getElementById(
      "depositCurrencyCode"
    ) as HTMLSelectElement;
    depositCurrencyCodeElem.classList.remove("is-invalid");
    const currency = depositCurrencyCodeElem.value; // depositCurrencyCodeElem.options[depositCurrencyCodeElem.selectedIndex].value;

    const found = this.participant.value?.participantAccounts.find((item) => {
      return item.currencyCode === currency && item.type === "POSITION";
    });
    if (!found) {
      depositCurrencyCodeElem.classList.add("is-invalid");
      valid = false;
    }

    const depositExtRefElem: HTMLInputElement = document.getElementById(
      "depositExtRef"
    ) as HTMLInputElement;
    const depositNoteElem: HTMLInputElement = document.getElementById(
      "depositNote"
    ) as HTMLInputElement;

    if (!valid) return;

    const fundsMov: ParticipantFundsMovement = {
      id: uuid.v4(),
      amount: amount.toString(),
      currencyCode: currency,
      createdBy: "",
      createdDate: Date.now(),
      direction: this.depositWithdrawalModalMode,
      note: depositNoteElem.value,
      extReference: depositExtRefElem.value,
      approved: false,
      approvedBy: null,
      approvedDate: null,
      transferId: null,
    };

    this._participantsSvc
      .createFundsMovement(this.participant.value!.id, fundsMov)
      .subscribe(
        async () => {
          this.depositWithdrawalModalRef!.close();
          this._messageService.addSuccess(
            "Funds movement created with success!"
          );
          await this._fetchParticipant(this.participant.value!.id);
          this.navBar.select("fundsMovs");
        },
        (error) => {
          this.depositWithdrawalModalRef!.close();
          this._messageService.addError(
            `Funds movement creation failed with error: ${error}`
          );
        }
      );
  }

  approveFundsMov(fundsMovId: string) {
    this._participantsSvc
      .approveFundsMovement(this.participant.value!.id, fundsMovId)
      .subscribe(
        async () => {
          this._messageService.addSuccess(
            "Funds movement approved with success!"
          );
          await this._fetchParticipant(this.participant.value!.id);
          this.updateAccounts();
        },
        (error) => {
          if (this.depositWithdrawalModalRef)
            this.depositWithdrawalModalRef!.close();
          this._messageService.addError(
            `Funds movement approval failed with error: ${error.message}`
          );
        }
      );
  }

  rejectFundsMov(fundsMovId: string) {
    this._messageService.addError("Not implemented (rejectFundsMov)");
  }

  ndcAddNew() {
    const newNDC = this._participantsSvc.createEmptyNDC();

    this.newNDC = newNDC;
    this.ndcCreateModeEnabled = true;
    this.ndcEditModeEnabled = true;
  }

  setNDCType(event: any) {
    const type = event.target.value;
    if (!this.newNDC) {
      throw new Error(`newNDC is empty to create`);
    }
    this.newNDC.type = type;
  }

  createNDCRequest() {
    if (!this.newNDC) {
      throw new Error("newNDC is empty to create");
    }

    if (this.newNDC.type === "ABSOLUTE") {
      const fixedValue = document.getElementById("ndcAmount") as HTMLInputElement;
      this.newNDC.fixedValue = Number(fixedValue.value);
    } else if (this.newNDC.type === "PERCENTAGE") {
      const percentage = document.getElementById("ndcPercentage") as HTMLInputElement;
      this.newNDC.percentage = Number(percentage.value);
    } else {
      this._messageService.addWarning("Invalid Net Debit Cap Type");
      return;
    }

    const currencyElement = document.getElementById("ndcCurrency") as HTMLSelectElement;

    if (!currencyElement) {
      this._messageService.addWarning("Invalid Net Debit Cap Currency");
      return;
    }
    this.newNDC.currencyCode = currencyElement.value;

    // // check overlaps
    // if(this.participant.value?.netDebitCaps) {
    // 	const duplicateNDC = this.participant.value.netDebitCaps.find(
    // 		(item) =>
    // 			item.currencyCode === this.newNDC!.currencyCode
    // 	);
    // 	if (duplicateNDC) {
    // 		this._messageService.addWarning("An Net Debit Cap already exists for that currency");
    // 		return;
    // 	}
    // }
    // TODO check duplicates also in requests (pending approval)

    this._participantsSvc.createNDC(this.participant.value!.id, this.newNDC).subscribe(async (value) => {
      this.ndcCreateModeEnabled = false;
      this.ndcEditModeEnabled = false;
      this.newNDC = null;

      await this._fetchParticipant(this.participant.value!.id);
    },
      (error) => {
        this._messageService.addError(error.message);
      }
    );
  }

  ndcStopEdit() {
    if (this.ndcCreateModeEnabled) {
      this.newNDC = null;
    }
    this.ndcCreateModeEnabled = false;
    this.ndcEditModeEnabled = false;
  }

  approveNDCRequest(reqId: string) {
    this._participantsSvc
      .approveNDC(this.participant.value!.id, reqId)
      .subscribe(
        async () => {
          this._messageService.addSuccess("NDC Request approved with success!");

          await this._fetchParticipant(this.participant.value!.id);
        },
        (error) => {
          if (this.depositWithdrawalModalRef)
            this.depositWithdrawalModalRef!.close();
          this._messageService.addError(
            `NDC Request approval failed with error: ${error.message}`
          );
        }
      );
  }

  rejectNDCRequest(reqId: string) {
    this._messageService.addError("Not implemented (rejectNDCRequest)");
  }

  showDeposit() {
    this.depositWithdrawalModalMode = "FUNDS_DEPOSIT";
    this.depositWithdrawalModalRef = this._modalService.open(
      this.depositWithdrawalModal,
      { centered: true }
    );
  }

  showWithdrawal() {
    this.depositWithdrawalModalMode = "FUNDS_WITHDRAWAL";
    this.depositWithdrawalModalRef = this._modalService.open(
      this.depositWithdrawalModal,
      { centered: true }
    );
  }

  async copyParticipantIdToClipboard() {
    await navigator.clipboard.writeText(this.participant.value!.id || "");
  }
}
