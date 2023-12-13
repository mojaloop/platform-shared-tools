import {NgModule} from "@angular/core";

import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "src/app/home/home.component";
import {CanLoadIsLoggedIn} from "src/app/_pipes_and_guards/canload_guard";
import {SecurityPrivilegesComponent} from "src/app/security/privileges/security-privileges.component";
import {PlatformRoleDetailComponent} from "src/app/security/roles/platform-role-detail.component";
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
import {BulkTransfersComponent} from "src/app/bulk-transfers/bulk-transfers.component";
import {BulkTransferDetailComponent} from "./bulk-transfers/bulk-transfer-detail.component";
import {BulkTransferCreateComponent} from "./bulk-transfers/bulk-transfer-create.component";
import {SettlementsMatrixDetailComponent} from "src/app/settlements/settlements.matrix-detail.component";
import {SettlementsMatricesComponent} from "src/app/settlements/settlements.matrices.component";
import {SettlementsTransfersComponent} from "src/app/settlements/settlements.transfers.component";
import {SettlementsModelsComponent} from "./settlements/settlements.models.component";
import {SettlementsModelsCreateComponent} from './settlements/settlements.models.create.component';
import {AuditingComponent} from "./auditing/auditing.component";
import {BuiltinIamUsersListComponent} from "./security/builtin_iam/builtin-iam-users-list.component";
import {BuiltinIamUserCreateComponent} from "./security/builtin_iam/builtin-iam-user-create.component";
import {BuiltinIamUserDetailComponent} from "./security/builtin_iam/builtin-iam-user-detail.component";
import {PlatformRoleListComponent} from "./security/roles/platform-role-list.component";
import { BuiltinIamAppsListComponent } from "./security/builtin_iam/builtin-iam-apps-list.component";
import {BuiltinIamAppCreateComponent} from "./security/builtin_iam/builtin-iam-app-create.component";
import {BuiltinIamAppDetailComponent} from "./security/builtin_iam/builtin-iam-app-detail.component";
import {PlatformRoleCreateComponent} from "./security/roles/platform-role-create.component";
import { PendingApprovalsComponent } from "./participants/pending-approvals.component";
import {SettlementInitiationReport} from "./reports/settlement-initiation-report.component";
import {DFSPSettlementReport} from "./reports/dfsp-settlement-report.component";
import {DFSPSettlementDetailReport} from "./reports/dfsp-settlement-detail-report.component";


const routes: Routes = [
	{path: "", redirectTo: "/home", pathMatch: "full"},
	{path: "login", component: LoginComponent},
	{path: "home", component: HomeComponent},

	// IMPORTANT!!!
	// All routes after needs must include:
	// canActivate: [CanLoadIsLoggedIn]
	// to ensure valid login

	{path: "tests", component: TestsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "myaccount", component: MyAccountComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "security/builtin_iam/users", component: BuiltinIamUsersListComponent, canActivate: [CanLoadIsLoggedIn]},
	{
		path: "security/builtin_iam/users/new",
		component: BuiltinIamUserCreateComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "security/builtin_iam/users/:id",
		component: BuiltinIamUserDetailComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{path: "security/builtin_iam/apps", component: BuiltinIamAppsListComponent, canActivate: [CanLoadIsLoggedIn]},
	{
		path: "security/builtin_iam/apps/new",
		component: BuiltinIamAppCreateComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "security/builtin_iam/apps/:id",
		component: BuiltinIamAppDetailComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{path: "security/privileges", component: SecurityPrivilegesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "security/roles", component: PlatformRoleListComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "security/roles/new", component: PlatformRoleCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "security/roles/:id", component: PlatformRoleDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "hub", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants/new", component: ParticipantCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants/:id", component: ParticipantDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "participants", component: ParticipantsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "pending-approvals", component: PendingApprovalsComponent, canActivate: [CanLoadIsLoggedIn]},
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
	{path: "bulk-transfers", component: BulkTransfersComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-transfers/new", component: BulkTransferCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "bulk-transfers/:id", component: BulkTransferDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "account-lookup/oracles/:id", component: QuoteDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{
		path: "platform-configuration/main",
		component: PlatformConfigurationComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "platform-configuration/global",
		component: PlatformConfigurationGlobalComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{
		path: "platform-configuration/bcs",
		component: PlatformConfigurationBoundedContextComponent,
		canActivate: [CanLoadIsLoggedIn]
	},
	{path: "settlements/matrix/:id", component: SettlementsMatrixDetailComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/matrix", component: SettlementsMatricesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/batches", component: SettlementsBatchesComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/transfers", component: SettlementsTransfersComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/models", component: SettlementsModelsComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "settlements/models/new", component: SettlementsModelsCreateComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "auditing", component: AuditingComponent, canActivate: [CanLoadIsLoggedIn]},
	{path: "report/settlement-initiation-report", component: SettlementInitiationReport, canActivate: [CanLoadIsLoggedIn]},
	{path: "report/dfsp-settlement-report", component: DFSPSettlementReport, canActivate: [CanLoadIsLoggedIn]},
	{path: "report/dfsp-settlement-detail-report", component: DFSPSettlementDetailReport, canActivate: [CanLoadIsLoggedIn]},
];


@NgModule({
	declarations: [],
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
