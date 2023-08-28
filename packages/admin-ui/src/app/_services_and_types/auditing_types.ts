import {SignedSourceAuditEntry} from "@mojaloop/auditing-bc-public-types-lib";

/*************
 *
 * Server/Central types
 *
 **************/


// central audit record with central metadata and key id
export declare type CentralAuditEntry = SignedSourceAuditEntry & {
	invalidSourceSignature: boolean;            // invalid source sig detected by central auditing service
	persistenceTimestamp: number;               // unix timestamp of the persistence
	auditingSvcAppName: string;
	auditingSvcAppVersion: string;

	auditingSvcKeyId: string;
}


// final central audit record, fully signed
export declare type SignedCentralAuditEntry = CentralAuditEntry & {
	auditingSvcSignature: string;
}
