import { Component, OnDestroy, OnInit } from "@angular/core";
import { ParticipantsService } from "../_services_and_types/participants.service";
import { MessageService } from "../_services_and_types/message.service";
import { BehaviorSubject } from "rxjs";
import {
  IParticipantFundsMovement,
  IParticipantNetDebitCapChangeRequest,
} from "@mojaloop/participant-bc-public-types-lib";
import { IParticipantPendingApproval } from "../_services_and_types/participant_types";
import { UnauthorizedError } from "@mojaloop/security-bc-public-types-lib";

@Component({
  selector: "app-participants",
  templateUrl: "./pending-approvals.component.html",
})
export class PendingApprovalsComponent implements OnInit, OnDestroy {
  fundAdjustments: BehaviorSubject<
    IParticipantPendingApproval["fundsMovementRequest"]
  > = new BehaviorSubject<IParticipantPendingApproval["fundsMovementRequest"]>(
    []
  );
  isFundAdjustmentSelectAll: boolean = false;
  selectedFundAdjustment: IParticipantPendingApproval["fundsMovementRequest"] =
    [];

  ndcRequests: BehaviorSubject<
    IParticipantPendingApproval["ndcChangeRequests"]
  > = new BehaviorSubject<IParticipantPendingApproval["ndcChangeRequests"]>([]);
  isNDCSelectAll: boolean = false;
  selectedNDCRequest: IParticipantPendingApproval["ndcChangeRequests"] = [];

  fundAdjustmentCount: number = 0;
  ndcRequestCount: number = 0;

  constructor(
    private _participantsSvc: ParticipantsService,
    private _messageService: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log("PendingApprovalsComponent ngOnInit");

    await this.getPendingApprovalsSummary();
    await this.getPendingApprovals();
  }

  tabChange(e: any) {
    console.log(`Tab changed to ${e.nextId}`);
  }

  selectAllFundAdjustments(e: any) {
    const isChecked = e.target.checked;
    this.isFundAdjustmentSelectAll = isChecked;

    if (!isChecked) {
      this.selectedFundAdjustment = [];
    }
  }

  selectAllNDCRequests(e: any) {
    const isChecked = e.target.checked;
    this.isNDCSelectAll = isChecked;

    if (!isChecked) {
      this.selectedNDCRequest = [];
    }
  }

  selectFundAdjustment(
    e: any,
    fundAdjustment: IParticipantPendingApproval["fundsMovementRequest"][number]
  ) {
    const isChecked = e.target.checked;
    if (isChecked) {
      this.selectedFundAdjustment.push(fundAdjustment);
    } else {
      // find by id from fund adjustment and remove item from selectedFundAdjustment
      const index = this.selectedFundAdjustment.findIndex(
        (item) => item.id === fundAdjustment.id
      );
      if (index !== -1) {
        this.selectedFundAdjustment.splice(index, 1);
      }
    }
  }

  selectNDCRequests(
    e: any,
    ndcRequest: IParticipantPendingApproval["ndcChangeRequests"][number]
  ) {
    const isChecked = e.target.checked;
    if (isChecked) {
      this.selectedNDCRequest.push(ndcRequest);
    } else {
      // find by id from fund adjustment and remove item from selectedFundAdjustment
      const index = this.selectedNDCRequest.findIndex(
        (item) => item.id === ndcRequest.id
      );
      if (index !== -1) {
        this.selectedNDCRequest.splice(index, 1);
      }
    }
  }

  isSelectedNDCRequest(id: string): boolean {
    return this.selectedNDCRequest.some((item) => item.id === id);
  }

  isSelectedFundAdjustment(id: string): boolean {
    return this.selectedFundAdjustment.some((item) => item.id === id);
  }

  getApprovalData(approved: boolean) {
    let ndcRequests: IParticipantPendingApproval["ndcChangeRequests"] =
      this.selectedNDCRequest;
    let fundAdjustments: IParticipantPendingApproval["fundsMovementRequest"] =
      this.selectedFundAdjustment;
    if (this.isNDCSelectAll) {
      ndcRequests = this.ndcRequests.value;
    }
    if (this.isFundAdjustmentSelectAll) {
      fundAdjustments = this.fundAdjustments.value;
    }

    ndcRequests.forEach((item) => {
      item.approved = approved;
    });
    fundAdjustments.forEach((item) => {
      item.approved = approved;
    });
    return {
      ndcChangeRequests: ndcRequests,
      fundsMovementRequest: fundAdjustments,
      accountsChangeRequest: [],
      ipChangeRequests: [],
      contactInfoChangeRequests: [],
      statusChangeRequests: [],
    };
  }

  approvePendingApprovals() {
    const data = this.getApprovalData(true);
    this._participantsSvc.submitPendingApprovals(data).subscribe(
      () => {
        this._messageService.addSuccess("Approved!");
        this.getPendingApprovalsSummary();
        this.getPendingApprovals();
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      },
      () => {
        // reset all selected options
        this.selectedNDCRequest = [];
        this.selectedFundAdjustment = [];
        this.isNDCSelectAll = false;
        this.isFundAdjustmentSelectAll = false;
      }
    );
  }

  rejectPendingApprovals() {
    const data = this.getApprovalData(false);
    this._participantsSvc.submitPendingApprovals(data).subscribe(
      () => {
        this._messageService.addSuccess("Rejected!");
        this.getPendingApprovalsSummary();
        this.getPendingApprovals();
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      },
      () => {
        // reset all selected options
        this.selectedNDCRequest = [];
        this.selectedFundAdjustment = [];
        this.isNDCSelectAll = false;
        this.isFundAdjustmentSelectAll = false;
      }
    );
  }

  async getPendingApprovals() {
    this._participantsSvc.getPendingApprovals().subscribe(
      (result) => {
        this.fundAdjustments.next(result.fundsMovementRequest);
        this.ndcRequests.next(result.ndcChangeRequests);
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      }
    );
  }

  async getPendingApprovalsSummary() {
    this._participantsSvc.getPendingApprovalsSummary().subscribe(
      (result) => {
        this.fundAdjustmentCount =
          result.countByType.find(
            (counts) => counts.type === "fundsMovementRequest"
          )?.count || 0;
        this.ndcRequestCount =
          result.countByType.find(
            (counts) => counts.type === "ndcChangeRequests"
          )?.count || 0;
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      }
    );
  }

  ngOnDestroy() {}
}
