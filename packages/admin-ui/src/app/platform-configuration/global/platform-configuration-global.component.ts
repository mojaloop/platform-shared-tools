import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {PlatformConfigService} from "src/app/_services_and_types/platform-config.service";
import {BehaviorSubject, Subscription} from "rxjs";
import semver from "semver";
import {
	ConfigFeatureFlag,
	GlobalConfigurationSet,
	ConfigParameter,
	ConfigSecret,
	Currency,

} from "@mojaloop/platform-configuration-bc-public-types-lib";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CurrencyUpdatePayload  } from "src/app/_services_and_types/config_types";
import { MessageService } from "src/app/_services_and_types/message.service";
import { validateCurrency } from "../../_utils";

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

	public form!: FormGroup;
	public newCurrency : Currency | null = null ;
	public submitted: boolean = false;
	public originalCurrencyEditObject : Currency | null = null;
	
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

	@ViewChild("addCurrencyConfigItemModal")
	addCurrencyConfigItemModal!: NgbModal;

	@ViewChild("showDefaultConfigItemModal")
	showDefaultConfigItemModal!:NgbModal;
	showDefaultConfigItemModalRef?: NgbModalRef;

	@ViewChild("showCurrentConfigItemModal")
	showCurrentConfigItemModal!:NgbModal;
	showCurrentConfigItemModalRef?: NgbModalRef;

	private _editing: boolean = false;

	constructor(private _platformConfigsSvc: PlatformConfigService, private _modalService: NgbModal, private _messageService: MessageService) {

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
		this._initAddCurrencyForm();
	}

	ngOnDestroy() {
		if (this.globalConfigSetsSubs) {
			this.globalConfigSetsSubs.unsubscribe();
		}
	}

	get editing(): boolean {
		return this._editing;
	}

	showEditConfigItemModal(paramName : string) {
		
		if(paramName == "CURRENCIES"){
			this.editConfigItemModalRef = this._modalService.open(this.addCurrencyConfigItemModal, {centered: true});
		}else{
			this.editConfigItemModalRef = this._modalService.open(this.editConfigItemModal, {centered: true});
		}
	}

	private _initAddCurrencyForm() {
		this.form = new FormGroup({
			"code": new FormControl(this.newCurrency?.code, Validators.required),
			"num": new FormControl(this.newCurrency?.num),
			"decimals": new FormControl(this.newCurrency?.decimals, Validators.required),
		});
	}

	getConfigItem(e:Event,isDefault:boolean = true){
		e.preventDefault();		
		if(isDefault){
			this.showDefaultConfigItemModalRef = this._modalService.open(this.showDefaultConfigItemModal, {centered: true});
		}else {
			this.showCurrentConfigItemModalRef = this._modalService.open(this.showCurrentConfigItemModal, {centered: true});
		}
	}

	saveConfigItem(e: Event) {
		console.log(e);
	}

	saveCurrency(e: Event){

		if (!this.editConfigItemModalRef) return;
		this.submitted = true;

		const currencyCodeInput: HTMLInputElement = document.getElementById(
			"currency-code"
		) as HTMLInputElement;
		const currencyNumberInput: HTMLInputElement = document.getElementById(
			"currency-num"
		) as HTMLInputElement;
		const currencyDecimalsInput: HTMLInputElement = document.getElementById(
			"currency-decimals"
		) as HTMLInputElement;
	
		const newCurrency: Currency = {
			code: currencyCodeInput.value.toUpperCase(),
			num: currencyNumberInput.value,
			decimals: currencyDecimalsInput.valueAsNumber,
		};

		if(!validateCurrency(newCurrency)){
			this._messageService.addError(`Enter Valid Currency Spec.`);
			return;
		}

		this._platformConfigsSvc.getLatestGlobalConfig().subscribe(
			(latest) => {
				const currencyParameter = latest.parameters.find(
					(param) => param.name === "CURRENCIES"
				);
	
				if (!currencyParameter) {
					return;
				}
	
				const updateCurrencyList = currencyParameter.currentValue;
				const isCurrencyExist = updateCurrencyList.some((c: Currency) => c.code === newCurrency.code || c.num === newCurrency.num);
				if (isCurrencyExist) {
					this.editConfigItemModalRef!.close();
					this._messageService.addError(`The specified currency already exists.`);
					return;
				}
	
				// Push newCurrency into currentValue
				updateCurrencyList.push(newCurrency);
	
				const currencyUpdatePayload: CurrencyUpdatePayload = {
					iterationNumber: latest.iterationNumber,
					schemaVersion: latest.schemaVersion,
					newValues: [
						{
							type: "PARAMETER",
							name: "CURRENCIES",
							value: updateCurrencyList, // Use currentValue directly
						},
					],
				};
	
				// Update the globalConfigSetsWith new currency
				this.globalConfigSetsSubs = this._platformConfigsSvc.updateGlobalConfig(
					currencyUpdatePayload
				).subscribe(() => {
					this.editConfigItemModalRef!.close();
	
					console.log("PlatformConfigurationComponent saveConfigItem - successful");
					this._messageService.addSuccess("Currency Added");
					location.reload();
	
				},
					(error) => {
						this.editConfigItemModalRef!.close();
						this._messageService.addError(
							`Currency Add Operation Failed : ${error}`,
						);
					},
				);
				return true;
				
		});
	}

	
	toggleEdit(currency: Currency & { editing : boolean}) {
		currency.editing = !currency.editing;
		if (currency.editing) {
			this.originalCurrencyEditObject = {
				"code" : currency.code ,
				"num" : currency.num , 
				"decimals" : currency.decimals
			};
		}
	}

	rejectEdit(currency: Currency & { editing : boolean }){
		currency.editing = false; 
		if(this.originalCurrencyEditObject){
			currency.code = this.originalCurrencyEditObject?.code;
			currency.num = this.originalCurrencyEditObject?.num;
			currency.decimals = this.originalCurrencyEditObject?.decimals;
		}
	}
	confirmEdit(currency: Currency & { editing : boolean }) {
		
		const editCurrency : Currency= {
			"code" : currency.code ,
			"num" : currency.num , 
			"decimals" : currency.decimals
		};
		if(JSON.stringify(editCurrency) !== JSON.stringify(this.originalCurrencyEditObject)){
			if(this.updateCurrency(editCurrency)){
				currency.editing = false;
			}
		}else {
			this._messageService.addError("Same Objects");
		}

	}
	


	updateCurrency(currency: Currency) {

		if (!validateCurrency(currency)) {
			this._messageService.addError("Enter a valid currency specification.");
			return false;
		}
	

		this._platformConfigsSvc.getLatestGlobalConfig().subscribe(
			(latest) => {
				const currencyParameter = latest.parameters.find(
					param => param.name === "CURRENCIES"
				);
				if (!currencyParameter) {
					console.error("Currency Parameter Not Found");
					return false;
				}
			
				const updateCurrencyList = currencyParameter.currentValue;
				const index = updateCurrencyList.findIndex(
					(c : Currency) => c.code === this.originalCurrencyEditObject?.code || c.num === this.originalCurrencyEditObject?.num
				);
			
				if (index === -1) {
					this._messageService.addError("Currency not found");
					return false;
				}
			
				// Update currency in the list
				updateCurrencyList[index] = currency;
			
				const currencyUpdatePayload: CurrencyUpdatePayload = {
					iterationNumber: latest.iterationNumber,
					schemaVersion: latest.schemaVersion,
					newValues: [
						{
							type: "PARAMETER",
							name: "CURRENCIES",
							value: updateCurrencyList,
						},
					],
				};
			
				// Update the globalConfigSet with the new currency
				this.globalConfigSetsSubs = this._platformConfigsSvc.updateGlobalConfig(currencyUpdatePayload).subscribe(
					() => {
						console.log("Currency update successful");
						this._messageService.addSuccess("Currency updated");
						
						
					},
					error => {
						console.error("Currency update failed:", error);
						this._messageService.addError(`Currency update failed: ${error}`);
						return false; 
					}
				);
				return true;

			}
		);
	
		return true;
	}
}	