import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";

import {MessagesComponent} from './messages/messages.component';
import { HomeComponent } from './home/home.component';

import {CanLoadIsLoggedIn} from "src/app/_pipes_and_guards/canload_guard";
import { SecurityComponent } from 'src/app/security/main/security.component';
import { PlatformRoleDetailComponent } from './security/platform-role-detail/platform-role-detail.component';
import { ParticipantsComponent } from './participants/participants.component';
import { MyAccountComponent } from './my-account/my-account.component';
import {AuthInterceptor} from "src/app/_pipes_and_guards/auth_interceptor";
import {InteropInterceptor} from "src/app/_pipes_and_guards/interop_interceptor";
import { ParticipantDetailComponent } from 'src/app/participants/participant-detail.component';
import { PlatformConfigurationComponent } from './platform-configuration/platform-configuration.component';
import {
  PlatformConfigurationAppComponent
} from "src/app/platform-configuration/app/platform-configuration-app.component";
import {
  PlatformConfigurationGlobalComponent
} from "src/app/platform-configuration/global/platform-configuration-global.component";
import {ParticipantCreateComponent} from "src/app/participants/participant-create.component";
import { AccountLookupComponent } from './account-lookup/account-lookup.component';
import {AccountLookupOracleDetailComponent} from "src/app/account-lookup/oracle-detail.component";
import {AccountLookupOracleCreateComponent} from "src/app/account-lookup/oracle-create.component";
import {AccountLookupOracleListComponent} from "src/app/account-lookup/oracle-list.component";
import {LoginComponent} from "src/app/login/login.component";
import {TestsComponent} from "src/app/tests/tests.component";
import { QuotesComponent } from './quotes/quotes.component';
import { QuoteDetailComponent } from './quotes/quote-detail.component';
import { QuoteCreateComponent } from './quotes/quote-create.component';
import { BulkQuotesComponent } from './bulk-quotes/bulk-quotes.component';
import { BulkQuoteDetailComponent } from './bulk-quotes/bulk-quote-detail.component';
import { BulkQuoteCreateComponent } from './bulk-quotes/bulk-quote-create.component';
import { TransfersComponent } from './transfers/transfers.component';
import { TransferDetailComponent } from './transfers/transfer-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    MessagesComponent,
    HomeComponent,
    TestsComponent,
    LoginComponent,
    SecurityComponent,
    PlatformRoleDetailComponent,
    ParticipantsComponent,
    MyAccountComponent,
    ParticipantCreateComponent,
    ParticipantDetailComponent,
    PlatformConfigurationComponent,
    PlatformConfigurationAppComponent,
    PlatformConfigurationGlobalComponent,
    AccountLookupComponent,
    AccountLookupOracleListComponent,
    AccountLookupOracleDetailComponent,
    AccountLookupOracleCreateComponent,
    QuotesComponent,
    QuoteDetailComponent,
    QuoteCreateComponent,
    BulkQuotesComponent,
    BulkQuoteDetailComponent,
    BulkQuoteCreateComponent,
    TransfersComponent,
    TransferDetailComponent,
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
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: InteropInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
