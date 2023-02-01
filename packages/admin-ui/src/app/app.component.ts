import {Component, isDevMode, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {Router} from "@angular/router";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit,OnDestroy {
  title = "Mojaloop vNext Admin UI";
  isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoggedInSubs?:Subscription;

  username: BehaviorSubject<string> = new BehaviorSubject<string>("");
  usernameSubs?:Subscription;

  navbarOpen = false;


  constructor(private _authentication:AuthenticationService, private _router: Router) {
    console.log("AppComponent on ctor");

    this.isLoggedInSubs = _authentication.LoggedInObs.subscribe(value => {
      this.isLoggedIn.next(value);
    });

    this.usernameSubs = _authentication.UsernameObs.subscribe(value => {
      this.username.next(value);
    });
  }

  ngOnInit(): void {
    console.log("AppComponent ngOnInit");
  }

  ngOnDestroy() {
    if (this.isLoggedInSubs) {
      this.isLoggedInSubs.unsubscribe();
    }

    if (this.usernameSubs) {
      this.usernameSubs.unsubscribe();
    }
  }

  logout(){
    this._authentication.logout();
    this._router.navigateByUrl("/home");
  }
}
