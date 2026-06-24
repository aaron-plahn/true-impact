import { NonEmptyString } from '../../../../libs/data-types';
import { CLIENT_AGGREGATE_TYPE } from '../../../clients/client.composite-identifier';

export class SurveyParticipantCompositeIdentifier {
  @NonEmptyString({
    label: 'type',
    description:
      'distinguishes various types of surve participant (such as clients, employees, and service providers)',
  })
  type = CLIENT_AGGREGATE_TYPE; // This may allow other types such as EMPLOYEE in the future

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this survey participant',
  })
  id: string;
}
