import {Component, OnDestroy, OnInit} from "@angular/core";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {HUB_PARTICIPANT_ID, IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {MessageService} from "src/app/_services_and_types/message.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {paginate, PaginateResult} from "../_utils";

@Component({
	selector: "app-participants",
	templateUrl: "./participants.component.html",
	styleUrls: ["./participants.component.css"],
})
export class ParticipantsComponent implements OnInit, OnDestroy {

	readonly ALL_STR_ID = "(All)";
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;

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


	onFileDropped(event: any) {
		event.preventDefault();
		this.readAndConvertFile(event.dataTransfer.files);
	}

	onDragOver(event: any) {
		event.preventDefault();
	}

	onFileSelected(event: any) {
		const selectedFile = event.target.files[0];
		if (selectedFile) {
			this.readAndConvertFile(selectedFile);
		}
	}

	readAndConvertFile(file: File) {
		const fileReader = new FileReader();
		fileReader.readAsBinaryString(file)
		fileReader.onload = (event) => {
			let binaryData = event.target?.result; //to send backend later

		}
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
