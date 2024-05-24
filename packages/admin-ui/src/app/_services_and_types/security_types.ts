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

import { Privilege } from "@mojaloop/security-bc-public-types-lib";

// TODO use the sec public lib instead of local types

export type UserType = "HUB" | "DFSP";

export type ParticipantRole = {
	participantId: string;
	roleId: string;
}

export type LoginResponse = {
	scope: string | null;
	platformRoles: string[];
	expires_in: number;
}

export type UserLoginResponse = LoginResponse & {
	userType: UserType
	participantRoles: ParticipantRole[];
}



export interface IBuiltinIamUser{
	enabled: boolean;
	email: string;
	fullName: string;

	userType: UserType;

	passwordHash?:string;

	// array of role ids for platform wide access
	platformRoles: string[];

	// per participant roles
	participantRoles: ParticipantRole[];
}


// to be used on creation only
export interface IBuiltinIamUserCreate extends IBuiltinIamUser{
	password:string;
}


export interface IBuiltinIamApplication{
	enabled: boolean;
	clientId: string;

	canLogin: boolean;

	clientSecretHash?:string;

	// array of role ids
	platformRoles: string[];
}

// to be used on creation only
export interface IBuiltinIamApplicationCreate extends IBuiltinIamApplication{
	// Applications that can't login on their own have a null secret and no roles
	// Ex: UIs or APIs that always call other services using the caller/user token
	clientSecret:string | null;
}


export type PrivilegeWithOwnerAppInfo = Privilege & {
	boundedContextName: string;     // bounded context it belongs to
	applicationName: string;        // application it belongs to
	privilegeSetVersion: string;     // semver
}
