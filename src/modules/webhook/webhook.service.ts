/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { EventDataProps } from 'src/interface';

@Injectable()
export class WebhookService {
  public eventWebhook = new Subject<EventDataProps>();

  sendEvent(eventData: EventDataProps) {
    return this.eventWebhook.next(eventData);
  }

  getEvents(): Observable<EventDataProps> {
    return this.eventWebhook.asObservable();
  }
}
