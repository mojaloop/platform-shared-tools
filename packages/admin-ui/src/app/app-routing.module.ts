import {NgModule} from "@angular/core";

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
	PlatformConfigurationBoundedContextComponent
} from "src/app/platform-configuration/bounded-context/platform-configuration-bounded-context.component";
import {
	PlatformConfigurationGlobalComponent
} from "src/app/platform-configuration/global/platform-configuration-global.component";
import {ParticipantCreateComponent} from "src/app/participants/participant-create.component";
import {AccountLookupComponent} from "src/app/account-lookup/account-lookup.component";
import {AccountLookupOracleListComponent} from "src/app/account-lookup/oracle-list.component";
import {SettlementsBatchesComponent} from "src/app/settlements/settlements.batches.component";
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
import {SettlementsMatrixDetailComponent} from "src/app/settlements/settlements.matrix-detail.component";
import {SettlementsMatricesComponent} from "src/app/settlements/settlements.matrices.component";
import {SettlementsTransfersComponent} from "src/app/settlements/settlements.transfers.component";
import {SettlementsModelsComponent} from "./settlements/settlements.models.component";
import {SettlementsModelsCreateComponent} from './settlements/settlements.models.create.component';
import {AuditingComponent} from "./auditing/auditing.component";
import { DFSPSettlementReport } from "./report/dfsp-settlement-report.component";
import { DFSPSettlementDetailsReport } from "./report/dfsp-settlement-details-report.component";

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
	{
		path: "account-lookup-oracles/new",
		component: AccountLookupOracleCreateComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "account-lookup/oracles/:id",
		component: AccountLookupOracleDetailComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "account-lookup-associations",
		component: AccountLookupAssociationsListComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{path: "quotes", component: QuotesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes/new", component: QuoteCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes/:id", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "quotes/byTransactionId/:transactionId", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes", component: BulkQuotesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes/new", component: BulkQuoteCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-quotes/:id", component: BulkQuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers", component: TransfersComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers/new", component: TransferCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "transfers/:id", component: TransferDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup/oracles/:id", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{
		path: "platform-configuration-global",
		component: PlatformConfigurationGlobalComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "platform-configuration-bc",
		component: PlatformConfigurationBoundedContextComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{path: "platform-configuration", component: PlatformConfigurationComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/matrix/:id", component: SettlementsMatrixDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/matrix", component: SettlementsMatricesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/batches", component: SettlementsBatchesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/transfers", component: SettlementsTransfersComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/models", component: SettlementsModelsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/models/new", component: SettlementsModelsCreateComponent},
	{path: "report/dfsp-settlement-report", component: DFSPSettlementReport},
	{path: "report/dfsp-settlement-details-report", component: DFSPSettlementDetailsReport},
	{path: "auditing", component: AuditingComponent},
];


@NgModule({
	declarations: [],
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
