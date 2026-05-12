import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

interface DomainEvent {
  type: string;
  payload: unknown;
}

@WebSocketGateway(3999, { namespace: 'survey-events' })
export class SurveyEventsGateway {
  @WebSocketServer()
  server: Server;

  publishEvent(event: DomainEvent): void {
    this.server.emit('Survey Updated', event);
  }
}
