import {Component, OnInit} from "@angular/core";

import {BehaviorSubject, Subscription} from "rxjs";
import {MessageService} from "src/app/_services_and_types/message.service";
import {Association} from "src/app/_services_and_types/account-lookup_types";
import {AccountLookupService} from "src/app/_services_and_types/account-lookup.service";
import {UnauthorizedError} from "src/app/_services_and_types/errors";
import {Router} from '@angular/router';
import {paginate, PaginateResult} from "../_utils";
import { debug } from "console";

@Component({
	selector: 'app-account-lookup-oracle-associations-list',
	templateUrl: './associations-list.component.html'
})
export class AccountLookupAssociationsListComponent implements OnInit {

	readonly ALL_STR_ID = "(All)";
	registeredAssociations: BehaviorSubject<Association[]> = new BehaviorSubject<Association[]>([]);
	registeredAssociationsSubs?: Subscription;

	keywordPartyType: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordCurrency: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordFspId: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	keywordsSubs?: Subscription;

	paginateResult: BehaviorSubject<PaginateResult | null> = new BehaviorSubject<PaginateResult | null>(null);

	constructor(private _router: Router, private _accountLookUpService: AccountLookupService, private _messageService: MessageService) {
	}

	ngOnInit(): void {
		console.log("AccountLookupComponent ngOnInit");

		this.getSearchKeywords();

		// wait for the page components to layout
		setTimeout(() => {
			this.search();
		}, 50);
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

	search(pageIndex: number = 0) {
		const filterFspId = (document.getElementById("filterFspId") as HTMLSelectElement).value || undefined;
		const filterPartyId = (document.getElementById("filterPartyId") as HTMLSelectElement).value || undefined;
		const filterPartyType = (document.getElementById("filterPartyType") as HTMLSelectElement).value || undefined;
		const filterPartySubType = (document.getElementById("filterPartySubType") as HTMLSelectElement).value || undefined;
		const filterCurrency = (document.getElementById("filterCurrency") as HTMLSelectElement).value || undefined;

		this.registeredAssociationsSubs = this._accountLookUpService.search(
			(filterFspId === this.ALL_STR_ID ? undefined : filterFspId),
			(filterPartyId === this.ALL_STR_ID ? undefined : filterPartyId),
			(filterPartyType === this.ALL_STR_ID ? undefined : filterPartyType),
			(filterPartySubType === this.ALL_STR_ID ? undefined : filterPartySubType),
			(filterCurrency === this.ALL_STR_ID ? undefined : filterCurrency),
			pageIndex
		).subscribe((result) => {
			console.log("AccountLookupAssociationsComponent search - got AssociationssSearchResults");

			this.registeredAssociations.next(result.items);

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
		this.keywordsSubs = this._accountLookUpService.getSearchKeywords().subscribe((keywords) => {
			console.log("AssociationsComponent search - got getSearchKeywords");

			keywords.forEach(value => {
				if (value.fieldName == "partyType") this.keywordPartyType.next(value.distinctTerms);
				if (value.fieldName == "currency") this.keywordCurrency.next(value.distinctTerms);
				if (value.fieldName == "fspId") this.keywordFspId.next(value.distinctTerms);
			});
		}, error => {
			if (error && error instanceof UnauthorizedError) {
				this._messageService.addError(error.message);
			}
		});
	}

}
