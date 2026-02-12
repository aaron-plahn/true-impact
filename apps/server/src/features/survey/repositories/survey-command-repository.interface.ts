import { IBaseCommandRepository } from '../../../common/interfaces/persistence';
import { Survey } from '../survey.aggregate-root';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyCommandRepository extends IBaseCommandRepository<Survey> {}
