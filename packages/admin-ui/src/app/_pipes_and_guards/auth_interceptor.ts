/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 --------------
 ******/

"use strict";

import {Injectable} from "@angular/core";
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";
import {EventBusService} from "../_services_and_types/eventbus.service";
import {EventData} from "../_services_and_types/eventbus_types";
import {catchError} from "rxjs/operators";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from "@angular/router";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor(private _authentication: AuthenticationService, private _eventBusService: EventBusService, private _router: Router) {

	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const catch401ErrorPipeFn = catchError((error:any, caught: Observable<any>) => {
			// only interested in 401's that didn't come from the login page
			if (error instanceof HttpErrorResponse && error.status === 401 && req.url !== this._authentication.loginPostUrl) {
				this._authentication.redirectUrl = this._router.routerState.snapshot.url;
				this._eventBusService.emit(new EventData("LogoutForced", null));
				return throwError(error);
			}
			return throwError(error);
		});

		// if not logged in don't add the Authorization header
		const token = this._authentication.accessToken;
		if (!this || !this._authentication.isLoggedIn())
			return next.handle(req).pipe(catch401ErrorPipeFn);

		const clonedReq = req.clone({
			headers: req.headers.set("Authorization", "Bearer " + token)
		});

		return next.handle(clonedReq).pipe(catch401ErrorPipeFn);
	}

}
