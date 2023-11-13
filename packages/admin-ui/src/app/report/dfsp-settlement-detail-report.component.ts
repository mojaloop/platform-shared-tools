import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription } from "rxjs";
import moment from "moment";
import {
	HUB_PARTICIPANT_ID,
	IParticipant,
} from "@mojaloop/participant-bc-public-types-lib";

import { UnauthorizedError } from "../_services_and_types/errors";
import { MessageService } from "../_services_and_types/message.service";
import { ParticipantsService } from "../_services_and_types/participants.service";
import { ReportService } from "../_services_and_types/report.service";
import type { MatrixId } from "../_services_and_types/report_types";
import type { SettlementInfo } from "./dfsp-settlement-report.component";
import { formatNumber } from "../_utils";

interface ModifiedDetailReport {
	matrixId: string;
	settlementDate: string;
	payerFspId: string;
	payerParticipantName: string;
	payeeFspId: string;
	payeeParticipantName: string;
	transferId: string;
	transactionType: string;
	transactionDate: string;
	payerIdType: string;
	payerIdentifier: string;
	payeeIdType: string;
	payeeIdentifier: string;
	sentAmount: string;
	receivedAmount: string;
	currency: string;
}

@Component({
	selector: "app-dfsp-settlement-detail-report",
	templateUrl: "./dfsp-settlement-detail-report.component.html",
})
export class DFSPSettlementDetailReport implements OnInit {
	public dfspFilterForm!: FormGroup;
	public settlementIdForm!: FormGroup;

	showSettlementIdForm: boolean = false;
	showResults: boolean = false;
	chosenDfspId: string = "";
	settlementInfo: SettlementInfo | null = null;

	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<
		IParticipant[]
	>([]);
	participantsSubs?: Subscription;

	matrixIds: BehaviorSubject<MatrixId[]> = new BehaviorSubject<MatrixId[]>(
		[]
	);
	matrixIdsSubs?: Subscription;

	detailReports: BehaviorSubject<ModifiedDetailReport[]> =
		new BehaviorSubject<ModifiedDetailReport[]>([]);
	detailReportsSubs?: Subscription;

	constructor(
		private _participantsSvc: ParticipantsService,
		private _reportSvc: ReportService,
		private _messageService: MessageService
	) {}

	async ngOnInit(): Promise<void> {
		this._initForms();
		this.getParticipants();
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
		if (this.matrixIdsSubs) {
			this.matrixIdsSubs.unsubscribe();
		}
		if (this.detailReportsSubs) {
			this.detailReportsSubs.unsubscribe();
		}
	}

	private _initForms() {
		this.dfspFilterForm = new FormGroup({
			dfspName: new FormControl("", [Validators.required]),
			startDate: new FormControl("", [Validators.required]),
			endDate: new FormControl("", [Validators.required]),
		});

		this.settlementIdForm = new FormGroup({
			settlementId: new FormControl("", [Validators.required]),
		});
	}

	getParticipants() {
		this.participantsSubs = this._participantsSvc
			.getAllParticipants()
			.subscribe(
				(result) => {
					const onlyDfsps = result.items.filter(
						(value) => value.id !== HUB_PARTICIPANT_ID
					);

					this.participants.next(onlyDfsps);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	getMatrixIds(participantId: string, startDate: number, endDate: number) {
		this.matrixIdsSubs = this._reportSvc
			.getAllSettlementMatrixIds(participantId, startDate, endDate)
			.subscribe(
				(result) => {
					this.matrixIds.next(result);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	getDetailReports(participantId: string, matrixId: string) {
		this.detailReportsSubs = this._reportSvc
			.getAllSettlementDetailReports(participantId, matrixId)
			.subscribe(
				(result) => {
					if (result.length > 0) {
						const formattedDate = moment(
							result[0].settlementDate
						).format("DD-MMM-YYYY hh:mm:ss A");
						const chosenDfsp = this.participants.value.find(
							(value) => value.id === this.chosenDfspId
						);

						this.settlementInfo = {
							settlementId: result[0].matrixId,
							settlementCreatedDate: formattedDate,
							dfspId: chosenDfsp?.id || "",
							dfspName: chosenDfsp?.name || "",
						};
					} else {
						this.settlementInfo = null;
					}

					const detailReports = result.map((detailReport) => ({
						...detailReport,
						transactionDate: moment(
							detailReport.transactionDate
						).format("DD-MMM-YYYY hh:mm:ss A"),
						sentAmount:
							this.chosenDfspId === detailReport.payerFspId
								? formatNumber(detailReport.Amount)
								: "-",
						receivedAmount:
							this.chosenDfspId === detailReport.payeeFspId
								? formatNumber(detailReport.Amount)
								: "-",
						currency: detailReport.Currency,
					}));
					this.detailReports.next(detailReports);
				},
				(error) => {
					if (error && error instanceof UnauthorizedError) {
						this._messageService.addError(error.message);
					}
				}
			);
	}

	searchSettlementIds() {
		if (!this.dfspFilterForm.valid) {
			this._messageService.addError("Fill all the required fields!");
			return;
		}

		const dfspId = this.dfspFilterForm.controls.dfspName.value;
		const startDate = this.dfspFilterForm.controls.startDate.value;
		const endDate = this.dfspFilterForm.controls.endDate.value;
		const startDateTimestamp = new Date(startDate).getTime();
		const endDateTimestamp = new Date(endDate).getTime();

		this.getMatrixIds(dfspId, startDateTimestamp, endDateTimestamp);
		this.showSettlementIdForm = true;
		this.chosenDfspId = dfspId;
	}

	searchReports() {
		if (!this.settlementIdForm.valid) {
			this._messageService.addError("Settlement ID is required!");
			return;
		}

		const settlementId = this.settlementIdForm.controls.settlementId.value;

		this.getDetailReports(this.chosenDfspId, settlementId);
		this.showResults = true;
	}
}
