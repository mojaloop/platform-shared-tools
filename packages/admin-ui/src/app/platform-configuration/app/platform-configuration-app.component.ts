import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlatformConfigService} from "src/app/_services_and_types/platform-config.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {
  ConfigFeatureFlag,
  ConfigParameter,
  ConfigSecret,
  ConfigurationSet
} from "src/app/_services_and_types/platform-config_types";

export type ApplicationListItem  =  {
  boundedContextName: string;                     // target bounded context
  applicationName: string;                        // target application name
  applicationVersion: string;                     // target app version (semver format)
  iterationNumber?: number;                        // monotonic integer - increases on every configuration/values change
}

export type ParamListItem  = ConfigParameter & ApplicationListItem;
export type FeatureFlagListItem = ConfigFeatureFlag & ApplicationListItem;
export type SecretListItem  = ConfigSecret & ApplicationListItem;

@Component({
  selector: "app-platform-configuration-app",
  templateUrl: './platform-configuration-app.component.html'
})
export class PlatformConfigurationAppComponent implements OnInit, OnDestroy {
  configSetsSubs?:Subscription;

  apps: BehaviorSubject<ApplicationListItem[]> = new BehaviorSubject<ApplicationListItem[]>([]);
  params: BehaviorSubject<ParamListItem[]> = new BehaviorSubject<ParamListItem[]>([]);
  featureFlags: BehaviorSubject<FeatureFlagListItem[]> = new BehaviorSubject<FeatureFlagListItem[]>([]);
  secrets: BehaviorSubject<SecretListItem[]> = new BehaviorSubject<SecretListItem[]>([]);

  constructor(private _platformConfigsSvc:PlatformConfigService) {

  }

  ngOnInit(): void {
    console.log("PlatformConfigurationComponent ngOnInit");

    this.configSetsSubs = this._platformConfigsSvc.getAllAppConfigs().subscribe((list) => {
      console.log("PlatformConfigurationComponent ngOnInit - got getAll");

      const apps: ApplicationListItem[] = [];

      const params: ParamListItem[] = [];
      const featureFlags: FeatureFlagListItem[] = [];
      const secrets: SecretListItem[] = [];

      list.forEach(configSet => {
        const foundApp = apps.find(item => item.boundedContextName===configSet.boundedContextName &&
          item.applicationName===configSet.applicationName
        );

        if (!foundApp) {
          apps.push({
            boundedContextName: configSet.boundedContextName,
            applicationName: configSet.applicationName,
            applicationVersion: configSet.applicationVersion,
            iterationNumber: configSet.iterationNumber
          });
        } else if (foundApp && foundApp.iterationNumber! < configSet.iterationNumber) {
          foundApp.iterationNumber = configSet.iterationNumber;
          foundApp.applicationVersion = configSet.applicationVersion;
        }
      });

      // second pass
      list.forEach(configSet => {
        const foundApp = apps.find(item => item.boundedContextName===configSet.boundedContextName
          && item.applicationName===configSet.applicationName
          && item.applicationVersion===configSet.applicationVersion
          && item.iterationNumber===configSet.iterationNumber
        );

        if(!foundApp) return;

        configSet.parameters.forEach(param =>{
          params.push({
            boundedContextName: configSet.boundedContextName,
            applicationName: configSet.applicationName,
            applicationVersion: configSet.applicationVersion,
            ...param
          });
        });

        configSet.featureFlags.forEach(featureflag =>{
          featureFlags.push({
            boundedContextName: configSet.boundedContextName,
            applicationName: configSet.applicationName,
            applicationVersion: configSet.applicationVersion,
            ...featureflag
          });
        })

        configSet.secrets.forEach(secret =>{
          secrets.push({
            boundedContextName: configSet.boundedContextName,
            applicationName: configSet.applicationName,
            applicationVersion: configSet.applicationVersion,
            ...secret
          });
        });

      });

      this.apps.next(apps);
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
