import {NgModule} from "@angular/core";
import {BrowserModule} from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";

import {MessagesComponent} from './messages/messages.component';
import {HomeComponent} from './home/home.component';

import {CanLoadIsLoggedIn} from "src/app/_pipes_and_guards/canload_guard";
import {SecurityPrivilegesComponent} from 'src/app/security/privileges/security-privileges.component';
import {PlatformRoleDetailComponent} from './security/roles/platform-role-detail.component';
import {ParticipantsComponent} from './participants/participants.component';
import {MyAccountComponent} from './my-account/my-account.component';
import {AuthInterceptor} from "src/app/_pipes_and_guards/auth_interceptor";
import {InteropInterceptor} from "src/app/_pipes_and_guards/interop_interceptor";
import {ParticipantDetailComponent} from 'src/app/participants/participant-detail.component';
import {PlatformConfigurationComponent} from './platform-configuration/platform-configuration.component';
import {
	PlatformConfigurationBoundedContextComponent
} from "src/app/platform-configuration/bounded-context/platform-configuration-bounded-context.component";
import {
	PlatformConfigurationGlobalComponent
} from "src/app/platform-configuration/global/platform-configuration-global.component";
import {ParticipantCreateComponent} from "src/app/participants/participant-create.component";
import {AccountLookupComponent} from './account-lookup/account-lookup.component';
import {AccountLookupOracleDetailComponent} from "src/app/account-lookup/oracle-detail.component";
import {AccountLookupOracleCreateComponent} from "src/app/account-lookup/oracle-create.component";
import {AccountLookupOracleListComponent} from "src/app/account-lookup/oracle-list.component";
import {LoginComponent} from "src/app/login/login.component";
import {TestsComponent} from "src/app/tests/tests.component";
import {QuotesComponent} from './quotes/quotes.component';
import {QuoteDetailComponent} from './quotes/quote-detail.component';
import {QuoteCreateComponent} from './quotes/quote-create.component';
import {BulkQuotesComponent} from './bulk-quotes/bulk-quotes.component';
import {BulkQuoteDetailComponent} from './bulk-quotes/bulk-quote-detail.component';
import {BulkQuoteCreateComponent} from './bulk-quotes/bulk-quote-create.component';
import {TransfersComponent} from './transfers/transfers.component';
import {TransferDetailComponent} from './transfers/transfer-detail.component';
import {TransferCreateComponent} from './transfers/transfer-create.component';
import {BulkTransfersComponent} from './bulk-transfers/bulk-transfers.component';
import {BulkTransferDetailComponent} from './bulk-transfers/bulk-transfer-detail.component';
import {BulkTransferCreateComponent} from "./bulk-transfers/bulk-transfer-create.component";
import {AccountLookupAssociationsListComponent} from './account-lookup/associations-list.component';
import {SettlementsBatchesComponent} from 'src/app/settlements/settlements.batches.component';
import {SettlementsMatrixDetailComponent} from "src/app/settlements/settlements.matrix-detail.component";
import {SettlementsMatricesComponent} from './settlements/settlements.matrices.component';
import {SettlementsTransfersComponent} from "src/app/settlements/settlements.transfers.component";
import {SettlementsModelsComponent} from "./settlements/settlements.models.component";
import {SettlementsModelsCreateComponent} from './settlements/settlements.models.create.component';
import {AuditingComponent} from "./auditing/auditing.component";
import {BuiltinIamUsersListComponent} from "./security/builtin_iam/builtin-iam-users-list.component";
import {BuiltinIamUserCreateComponent} from "./security/builtin_iam/builtin-iam-user-create.component";
import {BuiltinIamUserDetailComponent} from "./security/builtin_iam/builtin-iam-user-detail.component";
import {PlatformRoleListComponent} from "./security/roles/platform-role-list.component";
import {BuiltinIamAppsListComponent} from "./security/builtin_iam/builtin-iam-apps-list.component";
import {BuiltinIamAppCreateComponent} from "./security/builtin_iam/builtin-iam-app-create.component";
import {BuiltinIamAppDetailComponent} from "./security/builtin_iam/builtin-iam-app-detail.component";
import {PlatformRoleCreateComponent} from "./security/roles/platform-role-create.component";
import {PendingApprovalsComponent} from './participants/pending-approvals.component'
import {SettlementInitiationReport} from "./reports/settlement-initiation-report.component";
import {DFSPSettlementReport} from "./reports/dfsp-settlement-report.component";
import {DFSPSettlementDetailReport} from "./reports/dfsp-settlement-detail-report.component";
import {DropZoneDirective} from "./_pipes_and_guards/drop-zone.directive";

@NgModule({
	declarations: [
		AppComponent,
		MessagesComponent,
		HomeComponent,
		TestsComponent,
		LoginComponent,
		SecurityPrivilegesComponent,
		PlatformRoleDetailComponent,
		ParticipantsComponent,
		MyAccountComponent,
		ParticipantCreateComponent,
		ParticipantDetailComponent,
		PlatformConfigurationComponent,
		PlatformConfigurationBoundedContextComponent,
		PlatformConfigurationGlobalComponent,
		AccountLookupComponent,
		AccountLookupOracleListComponent,
		AccountLookupOracleDetailComponent,
		AccountLookupOracleCreateComponent,
		AccountLookupAssociationsListComponent,
		QuotesComponent,
		QuoteDetailComponent,
		QuoteCreateComponent,
		BulkQuotesComponent,
		BulkQuoteDetailComponent,
		BulkQuoteCreateComponent,
		TransfersComponent,
		TransferDetailComponent,
		TransferCreateComponent,
		BulkTransfersComponent,
		BulkTransferDetailComponent,
		BulkTransferCreateComponent,
		SettlementsBatchesComponent,
		SettlementsMatrixDetailComponent,
		SettlementsMatricesComponent,
		SettlementsTransfersComponent,
		SettlementsModelsComponent,
		SettlementsModelsCreateComponent,
		AuditingComponent,
		BuiltinIamUsersListComponent,
		BuiltinIamUserCreateComponent,
		BuiltinIamUserDetailComponent,
		PlatformRoleListComponent,
		PlatformRoleCreateComponent,
		BuiltinIamAppsListComponent,
		BuiltinIamAppCreateComponent,
		BuiltinIamAppDetailComponent,
		SettlementInitiationReport,
		DFSPSettlementReport,
		DFSPSettlementDetailReport,
		DropZoneDirective,
		PendingApprovalsComponent,
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		NgbModule,
		AppRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		BrowserAnimationsModule,
		NoopAnimationsModule
	],
	providers: [
		CanLoadIsLoggedIn,
		{provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
		{provide: HTTP_INTERCEPTORS, useClass: InteropInterceptor, multi: true},
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
