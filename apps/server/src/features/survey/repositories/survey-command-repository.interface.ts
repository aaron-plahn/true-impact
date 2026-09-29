import { EventSourcedCommandRepository } from '../../../libs/cqrs-es';
import { Survey } from '../survey-management/survey.aggregate-root';

/**
 * We really don't need this interface because the `EventSourcedCommandRepository`
 * gives us a free implementation if we provide the simpler `EventRepository`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyCommandRepository extends EventSourcedCommandRepository<Survey> {}
