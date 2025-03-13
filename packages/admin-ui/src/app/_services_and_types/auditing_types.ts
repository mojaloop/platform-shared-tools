import {SignedSourceAuditEntry} from "@mojaloop/auditing-bc-public-types-lib";

/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*****/

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


export declare type AuditSearchResults = {
	pageSize: number;
	totalPages: number;
	pageIndex: number;
	items: SignedCentralAuditEntry[];
}
