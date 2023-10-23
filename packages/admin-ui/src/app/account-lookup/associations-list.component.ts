import {Component, OnInit} from "@angular/core";

import {BehaviorSubject, Subscription} from "rxjs";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Association} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {Router} from '@angular/router';

@Component({
	selector: 'app-account-lookup-oracle-associations-list',
	templateUrl: './associations-list.component.html'
})
export class AccountLookupAssociationsListComponent implements OnInit {
	registeredAssociations: BehaviorSubject<Association[]> = new BehaviorSubject<Association[]>([]);
	registeredAssociationsSubs?: Subscription;

	constructor(private _router: Router, private _accountLookUpService: AccountLookupService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("AccountLookupComponent ngOnInit");
		this.getOracleAssociations();
	}

	private getOracleAssociations() {
		this.registeredAssociationsSubs = this._accountLookUpService.getRegisteredAssociations().subscribe((list) => {
			this.registeredAssociations.next(list);
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
			this.registeredAssociations.next([]);
		});
	}
}
