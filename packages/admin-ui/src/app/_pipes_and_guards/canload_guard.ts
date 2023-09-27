import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import {Observable, of} from "rxjs";
import {AuthenticationService} from "src/app/_services_and_types/authentication.service";

@Injectable()
export class CanLoadIsLoggedIn implements CanActivate {
	constructor(private _auth: AuthenticationService, private _router: Router) {
	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		const url: string = state.url;

		return this.checkLogin(url);

	}

	checkLogin(url: string): boolean {
		if (this._auth.isLoggedIn()) {
			return true;
		}

		// Store the attempted URL for redirecting
		this._auth.redirectUrl = url;
		this._router.navigate(["/login"]);
		return false;
	}
}
