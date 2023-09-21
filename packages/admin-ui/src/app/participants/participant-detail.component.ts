import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "src/app/_services_and_types/message.service";
import * as uuid from "uuid";
import { cloneDeep } from 'lodash';

import {
  IParticipantNetDebitCapChangeRequest,
  Participant,
  ParticipantAccount,
  ParticipantAccountChangeRequest,
  ParticipantAllowedSourceIp,
  ParticipantFundsMovement,
  ParticipantFundsMovementDirection,
  participantSourceIpChangeRequest,
} from "src/app/_services_and_types/participant_types";
import { ParticipantsService } from "src/app/_services_and_types/participants.service";
import { BehaviorSubject } from "rxjs";
import {
  NgbModal,
  NgbModalRef,
  NgbNav,
} from "@ng-bootstrap/ng-bootstrap";
import { validateCIDR, validatePortRange, validatePorts } from "../_utils";

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
  newParticipantAccount: any;
  editingParticipantAccountOriginalData?: ParticipantAccount;

  sourceIpCreateModeEnabled = false;
  sourceIpEditModeEnabled = false;
  newSourceIp: any;
  editingSourceIpOriginalData?: ParticipantAllowedSourceIp;

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

  onEditAccount(account: ParticipantAccount): void {
    //debugger
    account.editing = true;
    this.accountEditModeEnabled = true;
    this.editingParticipantAccountOriginalData = { ...account };
  }

  onCancelEditingAccount(account: ParticipantAccount): void {
    //debugger
    this.accountCreateModeEnabled = false;
    this.accountEditModeEnabled = false;

    Object.assign(account, this.editingParticipantAccountOriginalData);
    account.editing = false;

  }

  onAddAccount(): void {
    this.accountCreateModeEnabled = true;
    this.newParticipantAccount = this._participantsSvc.createEmptyAccount();
  }

  saveEditAccount(account: ParticipantAccount): void {
    // Implement logic to save changes to the account

    let participantAccountChangeRequest: ParticipantAccountChangeRequest = {
      id: uuid.v4(),
      accountId: account.id,
      type: account.type,
      currencyCode: account.currencyCode,
      externalBankAccountId: account.externalBankAccountId,
      externalBankAccountName: account.externalBankAccountName,
      requestType: "ADD_ACCOUNT"
    }

    // check overlaps
    if (this.accountCreateModeEnabled) {
      participantAccountChangeRequest.requestType = "ADD_ACCOUNT";
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
    else {
      participantAccountChangeRequest.requestType = "CHANGE_ACCOUNT_BANK_DETAILS";
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

  /*
   * Source IPs
   * */

  onEditSourceIp(sourceIp: ParticipantAllowedSourceIp): void {
    debugger
    sourceIp.editing = true;
    this.sourceIpEditModeEnabled = true;

    this.editingSourceIpOriginalData = cloneDeep(sourceIp);
  }

  onCancelEditingSourceIp(sourceIP: ParticipantAllowedSourceIp): void {
    debugger
    this.sourceIpEditModeEnabled = false;
    this.sourceIpCreateModeEnabled = false;
    Object.assign(sourceIP, this.editingSourceIpOriginalData);
    sourceIP.editing = false;

  }

  onAddSourceIp(): void {
    this.sourceIpCreateModeEnabled = true;
    this.newSourceIp = this._participantsSvc.createEmptySourceIp();
  }

  onPortModeChange() {

    switch (this.newSourceIp.portMode) {
      case "ANY":
        this.newSourceIp.ports = "";
        break;
      case "SPECIFIC":
        this.newSourceIp.portRange.rangeFirst = null;
        this.newSourceIp.portRange.rangeLast = null;
        break;
      case "RANGE":
        this.newSourceIp.ports = "";
        break;
      default:
        break;
    }
  }

  validateData(sourceIp: ParticipantAllowedSourceIp): boolean {

    if (sourceIp.cidr.trim().length === 0) {
      this._messageService.addError("CIDR cannot be empty.");
      return false;
    }

    if (!validateCIDR(sourceIp.cidr.trim())) {
      this._messageService.addError("Invalid CIDR format.");
      return false;
    }


    if (sourceIp.portMode === "RANGE") {
      if (Number(sourceIp.portRange.rangeFirst) === 0 || Number(sourceIp.portRange.rangeFirst) === 0) {
        this._messageService.addError("Invalid Port Range values.");
        return false;
      }

      if (!validatePortRange(Number(sourceIp.portRange.rangeFirst), Number(sourceIp.portRange.rangeLast))) {
        this._messageService.addError("Invalid Port Range values.");
        return false;
      }
    }

    if (sourceIp.portMode === "SPECIFIC") {
      if (!validatePorts(sourceIp.ports)) {
        this._messageService.addError("Invalid Port value.");
        return false;
      }
    }

    return true;
  }

  saveEditSourceIp(sourceIp: ParticipantAllowedSourceIp): void {
    // Implement logic to save changes

    if (!this.validateData(sourceIp)) {
      return;
    }

    let sourceIpChangeRequest: participantSourceIpChangeRequest = {
      id: uuid.v4(),
      allowedSourceIpId: sourceIp.id,
      cidr: sourceIp.cidr,
      portMode: sourceIp.portMode,
      ports: sourceIp.portMode === "SPECIFIC" ? sourceIp.ports?.split(",").map(Number) : [],
      portRange: sourceIp.portMode === "RANGE" ? {
        rangeFirst: sourceIp.portRange.rangeFirst || 0,
        rangeLast: sourceIp.portRange.rangeLast || 0
      } :
        { rangeFirst: 0, rangeLast: 0 },
      requestType: "ADD_SOURCE_IP"
    }

    console.log(sourceIpChangeRequest);

    // check overlaps
    if (this.sourceIpCreateModeEnabled) {
      sourceIpChangeRequest.requestType = "ADD_SOURCE_IP";
      const duplicateSourceIp = this.participant.value?.participantSourceIpChangeRequests?.find(
        (item) =>
          item.cidr.split('/')[0] === sourceIp.cidr.split('/')[0]
        /* && item.portMode === sourceIp.portMode ||
        item.ports === sourceIp.ports &&
        item.portRange === sourceIp.portRange */
      );

      if (duplicateSourceIp) {
        this._messageService.addWarning(
          "Cannot add a second sourceIP of the same values."
        );

        this.sourceIpCreateModeEnabled = false;
        sourceIp.editing = false;
        return;
      }
    }
    else {
      sourceIpChangeRequest.requestType = "CHANGE_SOURCE_IP";
    }

    this._participantsSvc
      .createSourceIp(this.participant.value!.id, sourceIpChangeRequest)
      .subscribe(
        (value) => {
          this._fetchParticipant(this.participant.value!.id);
          this.updateAccounts();
          this.sourceIpCreateModeEnabled = false;
          this.sourceIpEditModeEnabled = false;
          sourceIp.editing = false;

          this._messageService.addSuccess(
            "SourceIP change request created!"
          );

        },
        (error: any) => {

          this._messageService.addError(error);
        }
      );
  }

  approveSourceIpChangeRequest(reqId: string) {
    this._participantsSvc
      .approveSourceIpChangeRequest(this.participant.value!.id, reqId)
      .subscribe(
        async () => {
          this._messageService.addSuccess("Successfully approved SourceIP change request.");

          await this._fetchParticipant(this.participant.value!.id);
        },
        (error) => {
          if (this.depositWithdrawalModalRef)
            this.depositWithdrawalModalRef!.close();
          this._messageService.addError(
            `SourceIP changes request approval failed with: ${error}`
          );
        }
      );
  }

  rejectSourceIpChangeRequest(reqId: string) {
    this._messageService.addError("Not implemented (rejectSourceIpChangeRequest)");
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
