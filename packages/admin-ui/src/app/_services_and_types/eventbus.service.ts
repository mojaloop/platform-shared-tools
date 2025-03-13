/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Crosslake
- Pedro Sousa Barreto <pedrob@crosslaketech.com>
*****/

"use strict";

import {Injectable} from "@angular/core";
import {Subject, Subscription} from "rxjs";
import { EventData } from "./eventbus_types";
import { filter, map } from 'rxjs/operators';

@Injectable({
	providedIn: "root"
})
export class EventBusService {
	private subject = new Subject<EventData>();


	emit(event: EventData) {
		this.subject.next(event);
	}

	on(eventName: string, action: any): Subscription {
		return this.subject.pipe(
			filter((e: EventData) => e.name === eventName),
			map((e: EventData) => e["value"])
		).subscribe(action);
	}
}
