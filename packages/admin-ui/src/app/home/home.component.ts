import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {MessageService} from "src/app/_services_and_types/message.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit,OnDestroy {
  isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoggedInSubs?:Subscription;

  constructor(private _authentication:AuthenticationService, private _messageService: MessageService) {

  }

  ngOnInit(): void {
    this.isLoggedInSubs = this._authentication.LoggedInObs.subscribe(value => {
      this.isLoggedIn.next(value);
    });
  }

  ngOnDestroy() {
    if (this.isLoggedInSubs) {
      this.isLoggedInSubs.unsubscribe();
    }
  }

  testSuccessToast(){
    this._messageService.addSuccess("success message");
  }
  testWarnToast(){
    this._messageService.addWarning("warning message");
  }
  testDangerToast(){
    this._messageService.addError("error message");
  }
}
