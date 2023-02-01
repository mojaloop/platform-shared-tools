import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {SettingsService} from "src/app/_services_and_types/settings.service";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {AppPrivileges, PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {AllPrivilegesResp} from "src/app/_services_and_types/security_types";

declare type MyAccountRole = {
  id:string,
  labelName:string,
  description:string
}

declare type MyAccountPrivs = {
  id:string,
  labelName:string,
  fromRoleLabel:string,
  description:string,
  ownerBc:string,
  ownerApp:string,
  ownerAppVersion:string
}

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html'
})
export class MyAccountComponent implements OnInit, OnDestroy {
  username: BehaviorSubject<string> = new BehaviorSubject<string>("");

  accessToken: BehaviorSubject<string> = new BehaviorSubject<string>("");
  decodedToken: BehaviorSubject<any> = new BehaviorSubject<any>({});

  private _usernameSubs?:Subscription;

  roles: BehaviorSubject<MyAccountRole[]> = new BehaviorSubject<MyAccountRole[]>([]);
  privs: BehaviorSubject<MyAccountPrivs[]> = new BehaviorSubject<MyAccountPrivs[]>([]);

  private _alllRolesSubs?:Subscription;
  private _alllPrivsSubs?:Subscription;

  constructor(private _authentication:AuthenticationService, private _authorizationService:AuthorizationService) {

  }

  ngOnInit(): void {

    this._usernameSubs = this._authentication.UsernameObs.subscribe(value => {
      this.username.next(value);
      this.decodedToken.next(this._authentication.decodedToken);
      this.accessToken.next(this._authentication.accessToken || "");

      const rolesList:MyAccountRole[] = [];
      const privsList:MyAccountPrivs[] = [];

      const privIdsList:{id:string, roleLabel:string}[] = [];

      this._alllPrivsSubs = this._authorizationService.getAllPrivileges().subscribe((appPrivs:AllPrivilegesResp[]) => {

        this._alllRolesSubs = this._authorizationService.getAllPlatformRoles().subscribe((platformRoles:PlatformRole[]) => {
          platformRoles.forEach(role => {
            if(this._authentication.rolesIds.includes(role.id)){
              rolesList.push({
                id: role.id,
                labelName: role.labelName,
                description: role.description
              });

              role.privileges.forEach(privId => {
                const exists = privIdsList.find(item => item.id === privId && item.roleLabel === role.labelName);
                if(!exists) privIdsList.push({
                  id: privId,
                  roleLabel: role.labelName
                });
              });
            }
          });

          privIdsList.forEach(item => {
            const foundAppPriv: AllPrivilegesResp | undefined = appPrivs.find(appPriv => appPriv.id===item.id);
            if(foundAppPriv){
              privsList.push({
                id: foundAppPriv.id,
                fromRoleLabel: item.roleLabel,
                labelName: foundAppPriv.labelName,
                description: foundAppPriv.description,
                ownerBc: foundAppPriv.boundedContextName,
                ownerApp: foundAppPriv.applicationName,
                ownerAppVersion: foundAppPriv.applicationVersion
              })
            }
          })

          this.roles.next(rolesList);
          this.privs.next(privsList);
        });
      });
    });
  }

  ngOnDestroy() {
    if (this._usernameSubs) {
      this._usernameSubs.unsubscribe();
    }
    if (this._alllRolesSubs) {
      this._alllRolesSubs.unsubscribe();
    }
    if (this._alllPrivsSubs) {
      this._alllPrivsSubs.unsubscribe();
    }
  }

  async copyAccessTokenToClipboard(){
    await navigator.clipboard.writeText(this.accessToken.value || "");
  }

}
