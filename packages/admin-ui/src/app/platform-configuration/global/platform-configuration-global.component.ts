import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {PlatformConfigService} from "src/app/_services_and_types/platform-config.service";
import {BehaviorSubject, Subscription} from "rxjs";
import semver from "semver";
import {
	ConfigFeatureFlag,
	GlobalConfigurationSet,
	ConfigParameter,
	ConfigSecret,

} from "@mojaloop/platform-configuration-bc-public-types-lib";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";

export type BaseListItem = {
	schemaVersion?: string;
	iterationNumber?: number;
}

export type ParamListItem = ConfigParameter & BaseListItem;
export type FeatureFlagListItem = ConfigFeatureFlag & BaseListItem;
export type SecretListItem = ConfigSecret & BaseListItem;

export type GlobalConfigStatus = {
	latestSchemaVersion: string;
	currentIteration: number;
	distinctVersionCount: number;
}

@Component({
	selector: "app-platform-configuration-global",
	templateUrl: './platform-configuration-global.component.html'
})
export class PlatformConfigurationGlobalComponent implements OnInit, OnDestroy {
	globalConfigSetsSubs?: Subscription;

	globalConfigStatus: BehaviorSubject<GlobalConfigStatus | null> = new BehaviorSubject<GlobalConfigStatus | null>(null);
	//latestSchemaVersions: BehaviorSubject<string> = new BehaviorSubject<string>("");
	//differentSchemaVersions: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

	params: BehaviorSubject<ParamListItem[]> = new BehaviorSubject<ParamListItem[]>([]);
	featureFlags: BehaviorSubject<FeatureFlagListItem[]> = new BehaviorSubject<FeatureFlagListItem[]>([]);
	secrets: BehaviorSubject<SecretListItem[]> = new BehaviorSubject<SecretListItem[]>([]);

	@ViewChild("editConfigItemModal") // Get a reference to the depositModal
	editConfigItemModal!: NgbModal;
	editConfigItemModalRef?: NgbModalRef;

	private _editing: boolean = false;

	constructor(private _platformConfigsSvc: PlatformConfigService, private _modalService: NgbModal) {

	}

	ngOnInit(): void {
		console.log("PlatformConfigurationComponent ngOnInit");

		this.globalConfigSetsSubs = this._platformConfigsSvc.getAllGlobalConfigs().subscribe((list) => {
			console.log("PlatformConfigurationComponent ngOnInit - got getAll");

			// sort by decreasing schemaVersion order (latest version first)
			list.sort((a: GlobalConfigurationSet, b: GlobalConfigurationSet) => semver.compare(b.schemaVersion, a.schemaVersion));
			const latestSchemaVersion = list[0].schemaVersion;

			if (!latestSchemaVersion) {
				this.globalConfigStatus.next(null);
				this.params.next([]);
				this.featureFlags.next([]);
				this.secrets.next([]);
				return;
			}

			const schemaVersions: string[] = [];
			const params: ParamListItem[] = [];
			const featureFlags: FeatureFlagListItem[] = [];
			const secrets: SecretListItem[] = [];

			// get distinct versions
			const distinctVersions = list.reduce((acc: string[], v: GlobalConfigurationSet) => (!acc.includes(v.schemaVersion) && acc.push(v.schemaVersion), acc), []);

			list = list.filter((item: GlobalConfigurationSet) => item.schemaVersion === latestSchemaVersion);
			const latestSchemaVersionIterationCount = list.length;
			list.sort((a: GlobalConfigurationSet, b: GlobalConfigurationSet) => b.iterationNumber - a.iterationNumber);
			const currentIteration = list[0].iterationNumber;

			// second pass
			list.forEach(configSet => {
				if (!schemaVersions.includes(configSet.schemaVersion)) {
					schemaVersions.push(configSet.schemaVersion);
				}
				if (configSet.schemaVersion !== latestSchemaVersion || configSet.iterationNumber !== currentIteration) return;

				configSet.parameters.forEach(param => {
					params.push({
						schemaVersion: configSet.schemaVersion,
						iterationNumber: configSet.iterationNumber,
						...param
					});
				});

				configSet.featureFlags.forEach(featureflag => {
					featureFlags.push({
						schemaVersion: configSet.schemaVersion,
						iterationNumber: configSet.iterationNumber,
						...featureflag
					});
				});

				configSet.secrets.forEach(secret => {
					secrets.push({
						schemaVersion: configSet.schemaVersion,
						iterationNumber: configSet.iterationNumber,
						...secret
					});
				});

			});

			const globalConfigStatus: GlobalConfigStatus = {
				latestSchemaVersion: latestSchemaVersion,
				currentIteration: currentIteration,
				distinctVersionCount: distinctVersions.length
			};

			this.globalConfigStatus.next(globalConfigStatus);
			this.params.next(params);
			this.featureFlags.next(featureFlags);
			this.secrets.next(secrets);
		});
	}

	ngOnDestroy() {
		if (this.globalConfigSetsSubs) {
			this.globalConfigSetsSubs.unsubscribe();
		}
	}

	get editing(): boolean {
		return this._editing;
	}

	showEditConfigItemModal() {
		this.editConfigItemModalRef = this._modalService.open(this.editConfigItemModal, {centered: true});
	}

	saveConfigItem(e: Event) {
		console.log(e);
	}

}
