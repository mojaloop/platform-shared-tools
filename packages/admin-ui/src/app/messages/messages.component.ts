import { Component, OnInit } from '@angular/core';
import {IMessage, MessageService} from "src/app/_services_and_types/message.service";

@Component({
  selector: 'app-messages',
  // selector: 'app-toasts',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
   host: {'[class.ngb-toasts]': 'true'}
})
export class MessagesComponent implements OnInit {
  dateFormat = "LLL d, H:mm:ss";
  constructor(public messageService: MessageService) { }

  ngOnInit(): void {
  }

  getMessages():IMessage[]{
    return this.messageService.getMessages();
  }

  close(alert: IMessage) {
		this.messageService.close(alert);
	}


}
