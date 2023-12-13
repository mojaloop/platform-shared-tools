/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 --------------
 ******/

"use strict";

/** BulkQuotes **/
export declare type BulkQuote = {
	bulkQuoteId: string;
	payer: {
		partyIdInfo: {
			partyIdType: string;
			partyIdentifier: string;
			partySubIdOrType: string | null;
			fspId: string | null;
		};
		merchantClassificationCode?: string | null,
		name?: string | null,
		personalInfo?: {
			complexName: {
				firstName: string | null;
				middleName: string | null;
				lastName: string | null;
			} | null,
			dateOfBirth: string | null
		} | null
	} | null;
	geoCode?: {
		latitude: string;
		longitude: string;
	} | null;
	expiration?: string | null;
	individualQuotes: {
		quoteId: string;
		transactionId: string;
		transactionRequestId: string | null;
		payee: {
			partyIdInfo: {
				partyIdType: string;
				partyIdentifier: string;
				partySubIdOrType: string | null;
				fspId: string | null;
			};
			merchantClassificationCode: string | null,
			name: string | null,
			personalInfo: {
				complexName: {
					firstName: string | null;
					middleName: string | null;
					lastName: string | null;
				} | null,
				dateOfBirth: string | null
			} | null
		};
		amountType: "SEND" | "RECEIVE";
		amount: {
			currency: string;
			amount: string;
		};
		fees: {
			currency: string;
			amount: string;
		} | null;
		transactionType: {
			scenario: string
			subScenario: string | null
			initiator: string
			initiatorType: string
			refundInfo: {
				originalTransactionId: string
				refundReason: string | null
			} | null,
			balanceOfPayments: string | null
		};
		note: string | null;
		extensionList: {
			extension: {
				key: string;
				value: string;
			}[]
		} | null;
	}[];
	extensionList: {
		extension: {
			key: string;
			value: string;
		}[]
	} | null;
	quotesNotProcessedIds: string[];
	status?: string;
	createdAt?: number;
	updatedAt?: number;
}
