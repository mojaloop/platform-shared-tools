import {Component, isDevMode, OnDestroy, OnInit} from "@angular/core";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {Router} from "@angular/router";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import { EventBusService } from "./_services_and_types/eventbus.service";
import {MessageService} from "./_services_and_types/message.service";


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
	title = "Mojaloop vNext Admin UI";
	isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	isLoggedInSubs?: Subscription;

	username: BehaviorSubject<string> = new BehaviorSubject<string>("");
	usernameSubs?: Subscription;

	eventBusSubs?: Subscription;

	navbarOpen = false;


	constructor(
		private _authentication: AuthenticationService,
		private _router: Router,
		private _settings: SettingsService,
		private _eventBusService: EventBusService,
		private _messages: MessageService
	) {
		console.log("AppComponent on ctor");
	}

	ngOnInit(): void {
		console.log("AppComponent ngOnInit");
		this.isLoggedInSubs = this._authentication.LoggedInObs.subscribe(value => {
			this.isLoggedIn.next(value);
		});

		this.usernameSubs = this._authentication.UsernameObs.subscribe(value => {
			this.username.next(value);
		});

		this.eventBusSubs = this._eventBusService.on("LogoutForced", () => {
			this.logout();
			this._messages.addError("You have been logged out, please login again");
		});
	}

	getVersion(): string {
		return this._settings.getVersion();
	}

	getEnvName(): string {
		return this._settings.envName;
	}

	ngOnDestroy() {
		if (this.isLoggedInSubs) {
			this.isLoggedInSubs.unsubscribe();
		}

		if (this.usernameSubs) {
			this.usernameSubs.unsubscribe();
		}
	}

	logout(force= false) {
		if(!this._authentication.accessToken && !force) return;

		this._authentication.logout();
		this._router.navigate(["/login"]);
		//window.location.reload();
	}
}
