import {Component} from "@angular/core";
import {IMessage, MessageService} from "src/app/_services_and_types/message.service";

@Component({
	selector: "app-messages",
	templateUrl: "./messages.component.html",
	styleUrls: ["./messages.component.css"],
	host: {"[class.ngb-toasts]": "true"}
})
export class MessagesComponent {
	dateFormat = "LLL d, H:mm:ss";

	constructor(public messageService: MessageService) {
	}


	getMessages(): IMessage[] {
		return this.messageService.getMessages();
	}

	close(alert: IMessage) {
		this.messageService.close(alert);
	}


}
