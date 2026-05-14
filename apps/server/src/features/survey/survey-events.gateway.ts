import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface ViewDiff {
  target: string; // element ID
  swap: 'outer';
  content: string; // HTML
}

interface BaseEventPayload {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

interface BaseEvent<TPayload extends BaseEventPayload = BaseEventPayload> {
  type: string;
  payload: {
    aggregateCompositeIdentifier: {
      type: string;
      id: string;
    };
  } & TPayload;
}

/**
 * This pattern is for POC only. If we move ahead with this, we want to
 * have a dedicated event consumer that
 * - calculates the diff to the given view (in TISdui format)
 * - and uses a web-socket to notify clients who have sufficient privileges
 */
const buildViewDiffForEvent = (e: BaseEvent): ViewDiff => {
  const { type, payload } = e;

  if (type === 'SURVEY_BEGAN') {
    const {
      // surveyId,
      aggregateCompositeIdentifier: { id: attemptId },
    } = payload as BaseEventPayload & { surveyId: string };

    /**
     * This is a creation command for a survey completion record.
     * As such, we need to redirect to the new page.
     */
    return {
      target: `BEGIN_SURVEY_1_1`,
      swap: 'outer',
      // We should do this in 2 steps - first build the SDUI then convert this fragment to HTML
      content: `<button><a href="/surveys/responses/participate/${attemptId}">GO</a></button>`,
    };
  }

  if (type === 'SURVEY_QUESTION_ANSWERED') {
    const {
      aggregateCompositeIdentifier: { id: attemptId },
    } = payload as BaseEventPayload & {
      questionLabel: string;
      chosenOptionLabel: string;
    };

    return {
      target: 'COMMAND_SUCCESS_1', // `surveys/attempts/${attemptId}`,
      swap: 'outer',
      // We should do this in 2 steps - first build the SDUI then convert this fragment to HTML
      content: `<button><a href="/surveys/responses/participate/${attemptId}">NEXT</a></button>`,
    };
  }

  return {
    target: `root`,
    swap: 'outer',
    content: `<div><p>Something went wrong!</p><p>Unsupported event type: ${type}</p></div>`,
  };
};

@WebSocketGateway({
  namespace: 'survey-events',
  // TODO let's decide how to deal with this
  cors: {
    origin: 'http://localhost:3001',
  },
})
export class SurveyEventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  /**
   * We force this to be async to
   * 1. avoid race-conditions with command success acknowledgements
   * 2. be consistent with the ultimate behaviour, which is an out-of-process publisher
   */
  async publishEvent<T extends BaseEvent = BaseEvent>(event: T): Promise<void> {
    try {
      await Promise.resolve();
      this.server.emit('SURVEY_UPDATED', buildViewDiffForEvent(event));
    } catch (_) {
      throw new Error(`Failed to publish event of type ${event.type}`);
    }
  }

  @SubscribeMessage('SOME_EVENT')
  handleClientEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const message =
      (body as { message?: string })?.message ||
      'body only: ${JSON.stringify(body)}';

    console.log({ incomingMessage: message });

    const response = { message: `You said: ${message}` };

    client.emit('SOME_EVENT', response);
  }

  handleConnection(client: Socket) {
    client.onAny((eventName, ...args) => {
      console.log(
        `Received an event: ${eventName} with data: ${JSON.stringify(args)}`,
      );
    });
  }
}
