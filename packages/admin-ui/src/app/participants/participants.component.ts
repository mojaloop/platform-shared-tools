import {Component, OnDestroy, OnInit} from "@angular/core";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {paginate, PaginateResult} from "../_utils";

@Component({
	selector: "app-participants",
	templateUrl: "./participants.component.html",
})
export class ParticipantsComponent implements OnInit, OnDestroy {
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

	readonly ALL_STR_ID = "(All)";
	entries: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	entriesSubs?: Subscription;

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

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
	}

	ngOnDestroy() {
		if (this.participantsSubs) {
			this.participantsSubs.unsubscribe();
		}
	}

	approve(participantId: string) {
		this._participantsSvc.approveParticipant(participantId).subscribe(
			(value) => {
				this._messageService.addSuccess("Participant Approved");
				this.ngOnInit();
			},
			(error) => {
				this._messageService.addError(error.message);
			}
		);
	}

	disable(participantId: string) {
		this._participantsSvc.disableParticipant(participantId).subscribe(
			(value) => {
				this._messageService.addSuccess("Participant Disabled");
				this.ngOnInit();
			},
			(error) => {
				this._messageService.addError(error.message);
			}
		);
	}

	search(pageIndex: number = 0) {

		const filterParticipantState = (document.getElementById("filterParticipantState") as HTMLSelectElement).value || null;
		const filterParticipantId = (document.getElementById("filterParticipantId") as HTMLSelectElement).value || null;
		const filterParticipantName = (document.getElementById("filterParticipantName") as HTMLSelectElement).value || null;

		this.entriesSubs = this._participantsSvc.search(
			null,
			(filterParticipantState === this.ALL_STR_ID ? null : filterParticipantState),
			(filterParticipantId === this.ALL_STR_ID ? null : filterParticipantId),
			(filterParticipantName === this.ALL_STR_ID ? null : filterParticipantName),
			pageIndex
		).subscribe((result) => {
			console.log("ParticipantsComponent search - got ParticipantsSearchResults");

			this.entries.next(result.items);

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
