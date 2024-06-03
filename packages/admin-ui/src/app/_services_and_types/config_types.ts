import { Currency } from "@mojaloop/platform-configuration-bc-public-types-lib";

export declare type CurrencyUpdatePayload = {
        "iterationNumber": number;
        "schemaVersion": string;
        "newValues": CurrencyParameter[];
}

export declare type NewValueInfo = {
    type : string ;
    name : string ;
}
export declare type CurrencyParameter = NewValueInfo & {
    value: Currency[];
}