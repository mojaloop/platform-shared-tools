/**
 License
 --------------
 Copyright © 2021 Mojaloop Foundation

 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License.

 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * ThitsaWorks
 - Si Thu Myo <sithu.myo@thisaworks.com.

 --------------
 **/

export type ICertType = "PUBLIC" | "PRIVATE";

export enum CertificateRequestState {
  "CREATED" = "CREATED",
  "APPROVED" = "APPROVED",
  "REJECTED" = "REJECTED"
}

export interface ICertificateInfo {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    publicKeyAlgorithm: string;
    signatureAlgorithm: string;
    extensions: Record<string, any>;
}


export declare type Certificate = {
	_id: string;
    participantId: string;
    type: ICertType;
    cert: string;
    description: string | null;
	certInfo: ICertificateInfo | null;
	publicKey: string;

	requestState: CertificateRequestState;

    createdBy: string;
    createdDate: number;

    approved: boolean;
    approvedBy: string | null;
    approvedDate: number | null;

	rejected: boolean;
	rejectedBy: string | null;
	rejectedDate: number | null;

    lastUpdated: number;
}

export declare type CertificateRequest = {
    participantId: string;
    participantCertificateUploadRequests: Certificate[];
    createdDate: Date;
}

