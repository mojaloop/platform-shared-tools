import { Component, OnInit } from "@angular/core";
import { ParticipantsService } from "../_services_and_types/participants.service";
import { MessageService } from "../_services_and_types/message.service";
import { BehaviorSubject } from "rxjs";
import { IBulkApprovalResult, IParticipantPendingApproval } from "../_services_and_types/participant_types";
import { UnauthorizedError } from "@mojaloop/security-bc-public-types-lib";
import { ApprovalRequestState } from "@mojaloop/participant-bc-public-types-lib";

@Component({
  selector: "app-participants",
  templateUrl: "./pending-approvals.component.html",
})
export class PendingApprovalsComponent implements OnInit {
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
  ) { }

  async ngOnInit(): Promise<void> {
    console.log("PendingApprovalsComponent ngOnInit");

    this.getPendingApprovalsSummary();
    this.getPendingApprovals();
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

  getApprovalData(reqState: ApprovalRequestState): IParticipantPendingApproval {
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
      item.requestState = reqState;
    });

    fundAdjustments.forEach((item) => {
      item.requestState = reqState;
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

  approveFundAdjustmentPendingApprovals() {
    let fundAdjustments: IParticipantPendingApproval["fundsMovementRequest"] = 
    this.selectedFundAdjustment;
    
    if (this.isFundAdjustmentSelectAll) {
      fundAdjustments = this.fundAdjustments.value;
    }
    
    this._participantsSvc.submitPendingApprovals({
      fundsMovementRequest: fundAdjustments,
      ndcChangeRequests: [],
      accountsChangeRequest: [],
      ipChangeRequests: [],
      contactInfoChangeRequests: [],
      statusChangeRequests: [],
    },ApprovalRequestState.APPROVED).subscribe(
      async (results:IBulkApprovalResult[]) => {
        results.forEach((result)=> {
          if(result.status == "error"){
            this._messageService.addError(result.message, 10000);
          }else {
            this._messageService.addSuccess(result.message, 10000);
          }
        });

        await this.getPendingApprovalsSummary();
        await this.getPendingApprovals();
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      },
      () => {
        // reset all selected options
        this.selectedFundAdjustment = [];
        this.isFundAdjustmentSelectAll = false;
      }
    );
  }

  rejectFundAdjustmentPendingApprovals() {
    let fundAdjustments: IParticipantPendingApproval["fundsMovementRequest"] =
      this.selectedFundAdjustment;
    if (this.isFundAdjustmentSelectAll) {
      fundAdjustments = this.fundAdjustments.value;
    }
    /* fundAdjustments.forEach((item) => {
      item.requestState = ApprovalRequestState.REJECTED;
    }); */
    this._participantsSvc.submitPendingApprovals({
      fundsMovementRequest: fundAdjustments,
      ndcChangeRequests: [],
      accountsChangeRequest: [],
      ipChangeRequests: [],
      contactInfoChangeRequests: [],
      statusChangeRequests: [],
    }, ApprovalRequestState.REJECTED).subscribe(
      async (results:IBulkApprovalResult[]) => {
        results.forEach((result)=> {
          if(result.status == "error"){
            this._messageService.addError(result.message, 10000);
          }else {
            this._messageService.addSuccess(result.message, 10000);
          }
        });

        await this.getPendingApprovalsSummary();
        await this.getPendingApprovals();
      },
      (error) => {
        if (error && error instanceof UnauthorizedError) {
          this._messageService.addError(error.message);
        }
      },
      () => {
        // reset all selected options
        this.selectedFundAdjustment = [];
        this.isFundAdjustmentSelectAll = false;
      }
    );
  }

  approveNDCRequestPendingApprovals() {
    let ndcRequests: IParticipantPendingApproval["ndcChangeRequests"] =
      this.selectedNDCRequest;
    if (this.isFundAdjustmentSelectAll) {
      ndcRequests = this.ndcRequests.value;
    }
    
    this._participantsSvc
      .submitPendingApprovals({
        fundsMovementRequest: [],
        ndcChangeRequests: ndcRequests,
        accountsChangeRequest: [],
        ipChangeRequests: [],
        contactInfoChangeRequests: [],
        statusChangeRequests: [],
      }, ApprovalRequestState.APPROVED)
      .subscribe(
        async (results:IBulkApprovalResult[]) => {
          results.forEach((result)=> {
            if(result.status == "error"){
              this._messageService.addError(result.message, 10000);
            }else {
              this._messageService.addSuccess(result.message, 10000);
            }
          });
          
          await this.getPendingApprovalsSummary();
          await this.getPendingApprovals();
        },
        (error) => {
          if (error && error instanceof UnauthorizedError) {
            this._messageService.addError(error.message);
          }
        },
        () => {
          // reset all selected options
          this.selectedNDCRequest = [];
          this.isNDCSelectAll = false;
        }
      );
  }

  rejectNDCRequestPendingApprovals() {
    let ndcRequests: IParticipantPendingApproval["ndcChangeRequests"] =
      this.selectedNDCRequest;
    if (this.isFundAdjustmentSelectAll) {
      ndcRequests = this.ndcRequests.value;
    }
   
    this._participantsSvc
      .submitPendingApprovals({
        fundsMovementRequest: [],
        ndcChangeRequests: ndcRequests,
        accountsChangeRequest: [],
        ipChangeRequests: [],
        contactInfoChangeRequests: [],
        statusChangeRequests: [],
      }, ApprovalRequestState.REJECTED)
      .subscribe(
        async (results:IBulkApprovalResult[]) => {
          results.forEach((result)=> {
            if(result.status == "error"){
              this._messageService.addError(result.message, 10000);
            }else {
              this._messageService.addSuccess(result.message, 10000);
            }
          });

          await this.getPendingApprovalsSummary();
          await this.getPendingApprovals();
        },
        (error) => {
          if (error && error instanceof UnauthorizedError) {
            this._messageService.addError(error.message);
          }
        },
        () => {
          // reset all selected options
          this.selectedNDCRequest = [];
          this.isNDCSelectAll = false;
        }
      );
  }

  async getPendingApprovals(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._participantsSvc.getPendingApprovals().subscribe(
        (result) => {
          this.fundAdjustments.next(result.fundsMovementRequest);
          this.ndcRequests.next(result.ndcChangeRequests);
          resolve();
        },
        (error) => {
          if (error && error instanceof UnauthorizedError) {
            this._messageService.addError(error.message);
          }
          reject();
        }
      );
    });
  }

  async getPendingApprovalsSummary(): Promise<void> {
    return new Promise((resolve, reject) => {
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
          resolve();
        },
        (error) => {
          if (error && error instanceof UnauthorizedError) {
            this._messageService.addError(error.message);
          }
          reject()
        }
      );
    });
  }
}
