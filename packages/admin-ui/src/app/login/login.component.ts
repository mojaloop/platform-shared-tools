"use strict";

import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {MessageService} from "src/app/_services_and_types/message.service";
import {ActivatedRoute, Router} from "@angular/router";
import {SettingsService} from "src/app/_services_and_types/settings.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  devMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(private _authentication:AuthenticationService, private _settings:SettingsService, private _messages:MessageService, private _route: ActivatedRoute, private _router: Router) {
    // this.devMode.next(isDevMode());
    this.devMode.next(this._settings.isDevMode);
  }

  ngOnInit(): void {
    const fromGuard:boolean = this._route.snapshot.queryParamMap.has("g") || false;
    if(fromGuard){
      this._messages.addWarning("Please fill in these settings before using any features requiring Thunes' API access")
    }

    this.form = new FormGroup({
      "username": new FormControl(this._settings.username, Validators.required),
      "password": new FormControl("", Validators.required)
    });
  }

  login(){
    this._authentication.login(this.form.controls["username"].value, this.form.controls["password"].value).subscribe(result => {
      if(result) {
        this._messages.addSuccess("Login successful");
        if (this._authentication.redirectUrl) {
          this._router.navigateByUrl(this._authentication.redirectUrl);
          this._authentication.redirectUrl = null;
        }else{
          this._router.navigateByUrl("/home");
        }
      }else{
        this._messages.addError("Unauthorized");
      }
    });




  }

}
