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

 import { IParticipant, IParticipantAccountChangeRequest, IParticipantContactInfoChangeRequest, IParticipantFundsMovement, IParticipantNetDebitCapChangeRequest, IParticipantSourceIpChangeRequest, IParticipantStatusChangeRequest } from "@mojaloop/participant-bc-public-types-lib";
 
 export declare type ParticipantsSearchResults = {
   pageSize: number;
   totalPages: number;
   pageIndex: number;
   items: IParticipant[];
 };
 
 export declare interface IParticipantPendingApprovalCountByType {
   type: string;
   count: number;
 }
 
 export declare interface IParticipantPendingApprovalSummary {
   totalCount: number;
   countByType: IParticipantPendingApprovalCountByType[];
 }
 
 export declare interface IParticipantPendingApproval {
   accountsChangeRequest: (IParticipantAccountChangeRequest & {
     participantId: string;
     participantName: string;
   })[];
   fundsMovementRequest: (IParticipantFundsMovement & {
     participantId: string;
     participantName: string;
   })[];
   ndcChangeRequests: (IParticipantNetDebitCapChangeRequest & {
     participantId: string;
     participantName: string;
   })[];
   ipChangeRequests: (IParticipantSourceIpChangeRequest & {
     participantId: string;
     participantName: string;
   })[];
   contactInfoChangeRequests: (IParticipantContactInfoChangeRequest & {
     participantId: string;
     participantName: string;
   })[];
   statusChangeRequests: (IParticipantStatusChangeRequest & {
     participantId: string;
     participantName: string;
   })[];
 }
 
 export interface FundMovement {
   matrixId: string
   participantId: string
   participantName: string
   participantBankAccountInfo: string
   bankBalance: number
   settledTransferAmount: string
   currencyCode: string
   type: string
   updateAmount: string
   settlementAccountId: string
   isDuplicate: boolean
 }
 
 export declare interface IBulkApprovalResult {
   reqId: string;
   status: "success" | "error";
   message: string;
 } 