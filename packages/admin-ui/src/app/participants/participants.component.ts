import {Component, OnDestroy, OnInit} from "@angular/core";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {HUB_PARTICIPANT_ID, IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import type {FundMovement} from "../_services_and_types/participant_types";
import {formatNumber, paginate, PaginateResult} from "../_utils";

@Component({
	selector: "app-participants",
	templateUrl: "./participants.component.html",
	styleUrls: ["./participants.component.css"],
})
export class ParticipantsComponent implements OnInit, OnDestroy {

	readonly ALL_STR_ID = "(All)";
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	selectedFile: File | null = null;
	fileUploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	strokeDashoffset = (190 - (190 * this.fileUploadProgress.value) / 100);
	fileUploading = false;
	transitionClass = 'circular-transition';
	validated = false;

	fundAdjustments: FundMovement[] = [];
	fundMovements: BehaviorSubject<FundMovement[]> = new BehaviorSubject<FundMovement[]>([]);
	fundMovementsSubs?: Subscription;

	keywordParticipantState: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordParticipantId: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordParticipantName: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	constructor(
		private _participantsSvc: ParticipantsService,
		private _messageService: MessageService
	) {
	}

	async ngOnInit(): Promise<void> {
		console.log("ParticipantsComponent ngOnInit");

		await this.getSearchKeywords();

		this.fileUploadProgress.subscribe((progress) => {
			this.strokeDashoffset = (190 - (190 * progress) / 100);
			// skip transition when progress's changed from 100 to 0
			this.transitionClass = progress > 0 ? 'circular-transition' : '';
		});

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
		if (this.fundMovementsSubs) {
			this.fundMovementsSubs.unsubscribe();
		}
	}

	onFileDropped(event: any) {
		event.preventDefault();
	}

	onDragOver(event: any) {
		event.preventDefault();
	}

	onFileSelected(event: any) {
		const selectedFile = event.target.files[0];

		if (selectedFile) {
			this.resetData();

			this.fileUploadProgress.next(0);
			this.selectedFile = selectedFile;
			this.fileUploading = true;

			const interval = setInterval(() => {
				this.fileUploadProgress.next(this.fileUploadProgress.value + 10);

				if (this.fileUploadProgress.value === 100) {
					this.fileUploading = false;
					clearInterval(interval);
				}
			}, 200);
		}
	}

	openFileUpload() {
		const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
		fileInput.click();
	}

	removeChosenFile() {
		this.selectedFile = null;
		const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
		fileInput.value = "";
	}

	resetData() {
		this.fundAdjustments = [];
		this.fundMovements.next([]);
		this.validated = false;
	}

	validateFile() {
		if (!this.selectedFile) return;

		const formData = new FormData();
		formData.append("settlementInitiation", this.selectedFile);

		this.fundMovementsSubs = this._participantsSvc
			.validateSettlementInitiationFile(formData)
			.subscribe(
				(result) => {
					this.fundAdjustments = result
						.map((fundMovement) => ({
							...fundMovement,
							updateAmount: formatNumber(
								fundMovement.updateAmount
							),
						}))
						.filter(
							(fundMovement) => +fundMovement.updateAmount !== 0
						);

					this.validated = true;
					this.fundMovements.next(result);
				},
				(error) => {
					this._messageService.addError(error);
				}
			);
	}

	requestFundAdjustment() {
		if (!this.fundAdjustments.length) return;

		// need to recalulate the fundAdjustments as this.fundAdjustments' updateAmount are formatted
		const fundAdjustments = this.fundMovements.value.filter(
			(fundMovement) => +fundMovement.updateAmount !== 0
		);
		const ignoreDuplicate = fundAdjustments.some(
			(fundAdjustment) => fundAdjustment.isDuplicate
		);

		this._participantsSvc
			.requestFundAdjustment(fundAdjustments, ignoreDuplicate)
			.subscribe(
				() => {
					const cancelButton = document.getElementById(
						"btn-cancel"
					) as HTMLButtonElement;
					cancelButton.click();

					this.removeChosenFile();
					this.resetData();

					this._messageService.addSuccess(
						"Fund adjustment request submitted."
					);
				},
				(error) => {
					this._messageService.addError(error);
				}
			);
	}

	search(pageIndex: number = 0) {

		const filterParticipantState = (document.getElementById("filterParticipantState") as HTMLSelectElement).value || undefined;
		const filterParticipantId = (document.getElementById("filterParticipantId") as HTMLSelectElement).value || undefined;
		const filterParticipantName = (document.getElementById("filterParticipantName") as HTMLSelectElement).value || undefined;

		this.participantsSubs = this._participantsSvc.search(
			(filterParticipantState === this.ALL_STR_ID ? undefined : filterParticipantState),
			(filterParticipantId === this.ALL_STR_ID ? undefined : filterParticipantId),
			(filterParticipantName === this.ALL_STR_ID ? undefined : filterParticipantName),
			pageIndex
		).subscribe((result) => {
			console.log("ParticipantsComponent search - got ParticipantsSearchResults");

			const onlyDfsps = result.items.filter(value => value.id !== HUB_PARTICIPANT_ID);

			this.participants.next(onlyDfsps);

			const pageRes = paginate(result.pageIndex, result.totalPages);
			console.log(pageRes);
			this.paginateResult.next(pageRes);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});

	}

	async getSearchKeywords() {
		this.keywordsSubs = this._participantsSvc.getSearchKeywords().subscribe((keywords) => {
			console.log("ParticipantComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "state") this.keywordParticipantState.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}
}
