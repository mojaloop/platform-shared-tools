import {Component, OnDestroy, OnInit} from "@angular/core";
import {PlatformConfigService} from "src/app/_services_and_types/platform-config.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {
	ConfigFeatureFlag,
	ConfigParameter,
	ConfigSecret,
} from "@mojaloop/platform-configuration-bc-public-types-lib";

export type BoundedContextListItem = {
	boundedContextName: string;                     // target bounded context
	schemaVersion: string;							// config schema version (semver format)
	iterationNumber?: number;                     	// monotonic integer - increases on every configuration/values change
}

export type ParamListItem = ConfigParameter & BoundedContextListItem;
export type FeatureFlagListItem = ConfigFeatureFlag & BoundedContextListItem;
export type SecretListItem = ConfigSecret & BoundedContextListItem;

@Component({
	selector: "app-platform-configuration-bounded-context",
	templateUrl: "./platform-configuration-bounded-context.component.html"
})
export class PlatformConfigurationBoundedContextComponent implements OnInit, OnDestroy {
	configSetsSubs?: Subscription;

	bcs: BehaviorSubject<BoundedContextListItem[]> = new BehaviorSubject<BoundedContextListItem[]>([]);
	params: BehaviorSubject<ParamListItem[]> = new BehaviorSubject<ParamListItem[]>([]);
	featureFlags: BehaviorSubject<FeatureFlagListItem[]> = new BehaviorSubject<FeatureFlagListItem[]>([]);
	secrets: BehaviorSubject<SecretListItem[]> = new BehaviorSubject<SecretListItem[]>([]);

	constructor(private _platformConfigsSvc: PlatformConfigService) {

	}

	ngOnInit(): void {
		console.log("PlatformConfigurationComponent ngOnInit");

		this.configSetsSubs = this._platformConfigsSvc.getAllBcConfigs().subscribe((list) => {
			console.log("PlatformConfigurationComponent ngOnInit - got getAll");

			const apps: BoundedContextListItem[] = [];

			const params: ParamListItem[] = [];
			const featureFlags: FeatureFlagListItem[] = [];
			const secrets: SecretListItem[] = [];

			list.forEach(configSet => {
				const foundBc = apps.find(item => item.boundedContextName === configSet.boundedContextName);

				if (!foundBc) {
					apps.push({
						boundedContextName: configSet.boundedContextName,
						schemaVersion: configSet.schemaVersion,
						iterationNumber: configSet.iterationNumber,
					});
				} else if (foundBc && foundBc.iterationNumber! < configSet.iterationNumber) {
					foundBc.iterationNumber = configSet.iterationNumber;
				}
			});

			// second pass
			list.forEach(configSet => {
				const foundApp = apps.find(item =>
					item.boundedContextName === configSet.boundedContextName && item.iterationNumber === configSet.iterationNumber
				);

				if (!foundApp) return;

				configSet.parameters.forEach(param => {
					params.push({
						boundedContextName: configSet.boundedContextName,
						schemaVersion: configSet.schemaVersion,
						...param
					});
				});

				configSet.featureFlags.forEach(featureflag => {
					featureFlags.push({
						boundedContextName: configSet.boundedContextName,
						schemaVersion: configSet.schemaVersion,
						...featureflag
					});
				});

				configSet.secrets.forEach(secret => {
					secrets.push({
						boundedContextName: configSet.boundedContextName,
						schemaVersion: configSet.schemaVersion,
						...secret
					});
				});

			});

			this.bcs.next(apps);
			this.params.next(params);
			this.featureFlags.next(featureFlags);
			this.secrets.next(secrets);
		});
	}

	ngOnDestroy() {
		if (this.configSetsSubs) {
			this.configSetsSubs.unsubscribe();
		}

	}
}
