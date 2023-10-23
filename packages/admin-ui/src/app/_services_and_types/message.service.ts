import {Injectable} from "@angular/core";


export interface IMessage {
	level: "success" | "danger" | "info" | "warning";
	message: string;
	date: Date;
	delay?: number;
}

@Injectable({
	providedIn: "root",
})
export class MessageService {
	private readonly messages: IMessage [];

	public readonly defaultDelay = 5000;

	constructor() {
		this.messages = [];
	}

	getMessages(): IMessage[] {
		return this.messages;
	}

	addError(message: string, delay?: number) {
		this.messages.push({
			message,
			date: new Date(),
			level: "danger",
			delay: delay ?? this.defaultDelay
		});
	}

	addWarning(message: string, delay?: number) {
		this.messages.push({
			message,
			date: new Date(),
			level: "warning",
			delay: delay ?? this.defaultDelay
		});
	}

	addSuccess(message: string, delay?: number) {
		this.messages.push({
			message,
			date: new Date(),
			level: "success",
			delay: delay ?? this.defaultDelay
		});
	}

	addDebug(message: string, delay?: number) {
		this.messages.push({
			message,
			date: new Date(),
			level: "info",
			delay: delay ?? this.defaultDelay
		});
	}

	close(message: IMessage) {
		this.messages.splice(this.messages.indexOf(message), 1);
	}


}
