import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlatformConfigService} from "src/app/_services_and_types/platform-config.service";


@Component({
  selector: 'app-platform-configuration',
  templateUrl: './platform-configuration.component.html'
})
export class PlatformConfigurationComponent implements OnInit, OnDestroy {


  constructor(private _platformConfigsSvc:PlatformConfigService) {

  }

  ngOnInit(): void {

  }

  ngOnDestroy() {


  }
}
