import {Component, OnInit} from "@angular/core";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {MessageService} from "src/app/_services_and_types/message.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {ParticipantsService} from "src/app/_services_and_types/participants.service";
import {IParticipant} from "@mojaloop/participant-bc-public-types-lib";
import {UnauthorizedError} from "src/app/_services_and_types/errors";

@Component({
	selector: 'app-tests',
	templateUrl: './tests.component.html',
	styleUrls: ['./tests.component.css']
})
export class TestsComponent implements OnInit {
	isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	isLoggedInSubs?: Subscription;
	participants: BehaviorSubject<IParticipant[]> = new BehaviorSubject<IParticipant[]>([]);
	participantsSubs?: Subscription;
	currencies: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

	constructor(private _participantsSvc: ParticipantsService, private _authentication: AuthenticationService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		this.isLoggedInSubs = this._authentication.LoggedInObs.subscribe(value => {
			this.isLoggedIn.next(value);
		});

		this.participantsSubs = this._participantsSvc.getAllParticipants().subscribe((list) => {
			// remove the hub from the list
			const newList: IParticipant[] = list.items.filter(value => value.id !== this._participantsSvc.hubId);

			const currenciesList: string[] = [];
			newList.forEach(participant => {
				participant.participantAccounts.forEach(acc => {
					if (!currenciesList.includes(acc.currencyCode)) currenciesList.push(acc.currencyCode);
				});
			});

			this.participants.next(newList);
			this.currencies.next(currenciesList);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

	ngOnDestroy() {
		if (this.isLoggedInSubs) {
			this.isLoggedInSubs.unsubscribe();
		}
	}

	simulateTransfer() {
		const payerElem: HTMLSelectElement | null = document.getElementById("transf_payer") as HTMLSelectElement;
		const payeeElem: HTMLSelectElement | null = document.getElementById("transf_payee") as HTMLSelectElement;
		const amountElem: HTMLInputElement | null = document.getElementById("transf_amount") as HTMLInputElement;
		const currencyElem: HTMLSelectElement | null = document.getElementById("transf_currency") as HTMLSelectElement;

		const payerId = payerElem.value;
		const payeeId = payeeElem.value;
		if (payerId === payeeId) {
			this._messageService.addWarning("Payer and Payee cannot be the same");
			return;
		}

		const amount = amountElem.valueAsNumber;
		if (!amount || amount <= 0) {
			this._messageService.addWarning("Invalid amount on transfer simulate");
			return;
		}
		const currencyCode = currencyElem.value;


		this._participantsSvc.simulateTransfer(payerId, payeeId, amount, currencyCode).subscribe(value => {
			this._messageService.addSuccess("Transfer simulated successfully");
		}, error => {
			this._messageService.addError("Error sim transfer: " + error);
		});

	}

	testSuccessToast() {
		this._messageService.addSuccess("success message");
	}

	testWarnToast() {
		this._messageService.addWarning("warning message");
	}

	testDangerToast() {
		this._messageService.addError("error message");
	}
}
