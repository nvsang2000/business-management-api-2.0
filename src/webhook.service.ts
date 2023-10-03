/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class WebhookService {
  public eventWebhook = new Subject<any>();

  sendEvent(eventData: any) {
    console.log('eventData', eventData);
    return this.eventWebhook.next(eventData);
  }

  getEvents(): Observable<any> {
    return this.eventWebhook.asObservable();
  }
}
