import {NgModule} from '@angular/core';

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
import {SettlementsComponent} from "src/app/settlements/settlements.component";
import {AccountLookupOracleCreateComponent} from './account-lookup/oracle-create.component';
import {AccountLookupOracleDetailComponent} from './account-lookup/oracle-detail.component';
import {AccountLookupAssociationsListComponent} from "src/app/account-lookup/associations-list.component";
import {LoginComponent} from "src/app/login/login.component";
import {TestsComponent} from "src/app/tests/tests.component";
import {QuotesComponent} from "src/app/quotes/quotes.component";
import {QuoteDetailComponent} from "src/app/quotes/quote-detail.component";
import {QuoteCreateComponent} from "src/app/quotes/quote-create.component";
import {BulkQuotesComponent} from "src/app/bulk-quotes/bulk-quotes.component";
import {BulkQuoteDetailComponent} from "src/app/bulk-quotes/bulk-quote-detail.component";
import {BulkQuoteCreateComponent} from './bulk-quotes/bulk-quote-create.component';
import {TransfersComponent} from './transfers/transfers.component';
import {TransferDetailComponent} from './transfers/transfer-detail.component';
import {TransferCreateComponent} from './transfers/transfer-create.component';

const routes: Routes = [
	{path: "", redirectTo: "/home", pathMatch: "full"},
	{path: "login", component: LoginComponent},
	{path: "home", component: HomeComponent},
	{path: "tests", component: TestsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "myaccount", component: MyAccountComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "security", component: SecurityComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "platformRole/:id", component: PlatformRoleDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "hub", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants/new", component: ParticipantCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants/:id", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants", component: ParticipantsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup", component: AccountLookupComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup-oracles", component: AccountLookupOracleListComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup-oracles/new", component: AccountLookupOracleCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup/oracles/:id", component: AccountLookupOracleDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup-associations", component: AccountLookupAssociationsListComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes", component: QuotesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes/new", component: QuoteCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes/:id", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes", component: BulkQuotesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes/new", component: BulkQuoteCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes/:id", component: BulkQuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers", component: TransfersComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers/new", component: TransferCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers/:id", component: TransferDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup/oracles/:id", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "platform-configuration-global", component: PlatformConfigurationGlobalComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "platform-configuration-app", component: PlatformConfigurationAppComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "platform-configuration", component: PlatformConfigurationComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements", component: SettlementsComponent, canActivate: [CanLoadIsLoggedIn]},
];


@NgModule({
	declarations: [],
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
