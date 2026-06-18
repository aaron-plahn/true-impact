import { SurveyResponseCompositeIdentifier } from 'src/features/survey/survey-completion';

// GroupSessionScheduled?
export class GroupProgramSessionScheduledPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  // TODO make this a proper date
  date: string;

  sessionId: string;
}

export class GroupProgramScheduled {
  readonly type = 'GROUP_PROGRAM_SESSION_SCHEDULED';

  readonly payload: GroupProgramSessionScheduledPayload;

  constructor({ payload }: { payload: GroupProgramSessionScheduledPayload }) {
    this.payload = payload;
  }
}
