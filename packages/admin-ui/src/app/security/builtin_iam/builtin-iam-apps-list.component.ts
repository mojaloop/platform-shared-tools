import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {BuiltinIamService} from "../../_services_and_types/builtin_iam.service";
import {IBuiltinIamApplication, IBuiltinIamUser} from "../../_services_and_types/security_types";

@Component({
	selector: 'app-security',
	templateUrl: './builtin-iam-apps-list.component.html'
})
export class BuiltinIamAppsListComponent implements OnInit, OnDestroy {
	apps: BehaviorSubject<IBuiltinIamApplication[]> = new BehaviorSubject<IBuiltinIamApplication[]>([]);
	appsSubs?: Subscription;

	constructor(private _builtinIamSvc:BuiltinIamService) {
	}

	ngOnInit(): void {
		this.search();
	}

	ngOnDestroy() {
		if (this.appsSubs) {
			this.appsSubs.unsubscribe();
		}
	}

	resetFilter(){
		(document.getElementById("filterClientId") as HTMLInputElement).value = "";
		(document.getElementById("filterLoginType") as HTMLInputElement).value = "ALL";
		(document.getElementById("filterAppState") as HTMLInputElement).value = "ALL";

		this.search();
	}

	search(){
		const clientId = (document.getElementById("filterClientId") as HTMLInputElement).value;

		const loginTypeStr = (document.getElementById("filterLoginType") as HTMLSelectElement).value;
		const canLogin = loginTypeStr==="ALL" ? undefined : (loginTypeStr==="CAN_LOGIN");

		const appStateStr = (document.getElementById("filterAppState") as HTMLSelectElement).value;
		const appState = appStateStr==="ALL" ? undefined : (appStateStr=="true");

		this.appsSubs = this._builtinIamSvc.getAllApps(clientId, canLogin, appState).subscribe((apps) => {
			this.apps.next(apps);
		});
	}
}
