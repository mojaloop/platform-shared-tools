import { Component, OnDestroy, OnInit } from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {PlatformRole} from "@mojaloop/security-bc-public-types-lib";
import {AuthorizationService} from "src/app/_services_and_types/authorization.service";

@Component({
  selector: 'app-platform-role-detail',
  templateUrl: './platform-role-detail.component.html',
  styleUrls: ['./platform-role-detail.component.css']
})
export class PlatformRoleDetailComponent implements OnInit {
  private _roleId: string | null;
  public role: BehaviorSubject<PlatformRole | undefined> = new BehaviorSubject<PlatformRole | undefined>(undefined);


  constructor(private _authorizationSvc:AuthorizationService, private route: ActivatedRoute) {
    this._roleId = this.route.snapshot.paramMap.get("id");


  }

  ngOnInit(): void {
    this._authorizationSvc.getAllPlatformRoles().subscribe((roles) => {
      console.log("SecurityComponent ngOnInit - got getAllPlatformRoles");
      const role:PlatformRole | undefined = roles.find(value => value.id == this._roleId);

      this.role.next(role);
    });
  }

}
