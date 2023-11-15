import {Injectable} from "@angular/core";
import {environment} from '../../environments/environment';
import packageJson from '../../../package.json';

const USERNAME_KEYNAME = "username";
const ACCESSTOKEN_KEYNAME = "accessToken";

const DEVELOPMENT_ENV_NAME = "dev";
const PRODUCTION_ENV_NAME = "prod";

//constants shared
export const DEFAULT_TEST_CALL_REDIRECT_WAIT_MS = 750;

@Injectable({
	providedIn: 'root',
})
export class SettingsService {
	private readonly _isDevMode: boolean;

	public accessToken: string | null;
	public username: string | null;

	constructor() {
		// TODO consider mangling these settings (not encrypt)
		this.accessToken = localStorage.getItem(ACCESSTOKEN_KEYNAME);
		this.username = localStorage.getItem(USERNAME_KEYNAME);
		this._isDevMode = !environment.production;
	}

	get isDevMode(): boolean {
		return this._isDevMode;
	}

	getVersion(): string {
		return packageJson.version;
	}

	get envName(): string {
		if (this._isDevMode) {
			return DEVELOPMENT_ENV_NAME;
		}

		return PRODUCTION_ENV_NAME;
	}

	save(): boolean {
		if (this.accessToken)
			localStorage.setItem(ACCESSTOKEN_KEYNAME, this.accessToken);

		if (this.username)
			localStorage.setItem(USERNAME_KEYNAME, this.username);

		return true;
	}

	clearToken() {
		localStorage.removeItem(ACCESSTOKEN_KEYNAME);
	}

	clearAll() {
		localStorage.removeItem(ACCESSTOKEN_KEYNAME);
		localStorage.removeItem(USERNAME_KEYNAME);
	}

}
