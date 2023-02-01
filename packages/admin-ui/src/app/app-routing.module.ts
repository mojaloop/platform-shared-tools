import { NgModule } from '@angular/core';

import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "src/app/home/home.component";
import {CanLoadIsLoggedIn} from "src/app/_pipes_and_guards/canload_guard";
import {SecurityComponent} from "src/app/security/main/security.component";
import {PlatformRoleDetailComponent} from "src/app/security/platform-role-detail/platform-role-detail.component";
import {ParticipantsComponent} from "src/app/participants/participants.component";
import {MyAccountComponent} from "src/app/my-account/my-account.component";
import {ParticipantDetailComponent} from "src/app/participants/participant-detail.component";
import {PlatformConfigurationComponent} from "src/app/platform-configuration/platform-configuration.component";
import {
  PlatformConfigurationAppComponent
} from "src/app/platform-configuration/app/platform-configuration-app.component";
import {
  PlatformConfigurationGlobalComponent
} from "src/app/platform-configuration/global/platform-configuration-global.component";
import {ParticipantCreateComponent} from "src/app/participants/participant-create.component";
import {AccountLookupComponent} from "src/app/account-lookup/account-lookup.component";
import {AccountLookupOracleListComponent} from "src/app/account-lookup/oracle-list.component";
import { AccountLookupOracleCreateComponent } from './account-lookup/oracle-create.component';
import { AccountLookupOracleDetailComponent } from './account-lookup/oracle-detail.component';
import {LoginComponent} from "src/app/login/login.component";
import {TestsComponent} from "src/app/tests/tests.component";

const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "login", component: LoginComponent},
  { path: "home", component: HomeComponent },
  { path: "tests", component: TestsComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "myaccount", component: MyAccountComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "security", component: SecurityComponent , canActivate: [CanLoadIsLoggedIn]},
  { path: "platformRole/:id", component: PlatformRoleDetailComponent , canActivate: [CanLoadIsLoggedIn]},
  { path: "hub", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "participants/new", component: ParticipantCreateComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "participants/:id", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "participants", component: ParticipantsComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "account-lookup", component: AccountLookupComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "account-lookup-oracles", component: AccountLookupOracleListComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "account-lookup-oracles/new", component: AccountLookupOracleCreateComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "account-lookup/oracles/:id", component: AccountLookupOracleDetailComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "platform-configuration-global", component: PlatformConfigurationGlobalComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "platform-configuration-app", component: PlatformConfigurationAppComponent, canActivate: [CanLoadIsLoggedIn]},
  { path: "platform-configuration", component: PlatformConfigurationComponent, canActivate: [CanLoadIsLoggedIn]},
];


@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
