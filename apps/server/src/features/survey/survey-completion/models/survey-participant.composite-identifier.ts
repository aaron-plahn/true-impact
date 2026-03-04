import { CLIENT_AGGREGATE_TYPE } from '../../../clients/client.composite-identifier';

export class SurveyParticipantCompositeIdentifier {
  type = CLIENT_AGGREGATE_TYPE; // This may allow other types such as EMPLOYEE in the future
  id: string;
}
