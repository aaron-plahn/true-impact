import {
  IBaseCommandRepository,
  PersistenceAcknowledgement,
} from 'src/common/interfaces/persistence';
import { InMemoryCommandRepositoryProvider } from 'src/common/persistence';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import { isDeepStrictEqual } from 'util';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import {
  SurveyResponseRecord,
  SurveyResponseRecordPersistenceDto,
} from '../survey-response-record.aggregate-root';
import { ISurveyCompletionCommandRepository } from './survey-completion-command-repository.interface';

export class InMemorySurveyCompletionCommandRepository implements ISurveyCompletionCommandRepository {
  private readonly base: IBaseCommandRepository<SurveyResponseRecord>;

  constructor(inMemoryRepositoryProvider: InMemoryCommandRepositoryProvider) {
    this.base = inMemoryRepositoryProvider.forFeature<
      SurveyResponseRecordPersistenceDto,
      SurveyResponseRecord
    >(SurveyResponseRecord);
  }

  exists(id: string): Promise<boolean> {
    return this.base.exists(id);
  }

  fetchById(id: string): Promise<SurveyResponseRecord> | null {
    return this.base.fetchById(id);
  }

  fetchMany(): Promise<SurveyResponseRecord[]> {
    throw new Error('Method not implemented.');
  }

  create(instance: SurveyResponseRecord): Promise<string | TrueImpactError> {
    return this.base.create(instance);
  }

  async begin(
    emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (emptyCompletionRecord.participant) {
      // This is not how we should implement this in the production DB as it's not performant
      const allAttempts = await this.base.fetchMany();

      const activeAttemptsForThisParticipant = allAttempts.filter((attempt) => {
        if (attempt.hasBeenSubmitted || attempt.hasBeenAbandoned) {
          return false;
        }

        return isDeepStrictEqual(
          attempt.participant,
          emptyCompletionRecord.participant,
        );
      });

      if (activeAttemptsForThisParticipant.length > 0) {
        return new TrueImpactBadUserInputError([
          new TrueImpactError(
            `You cannot begin a new attempt of survey [${emptyCompletionRecord.survey.name}], as there is already an attempt [${activeAttemptsForThisParticipant[0].id}] in progress for participant ${emptyCompletionRecord.participant.type}/${emptyCompletionRecord.participant.id}`,
          ),
        ]);
      }
    }

    const result = await this.base.create(emptyCompletionRecord);

    if (result instanceof TrueImpactError) {
      return result;
    }

    return {
      id: result,
      revision: '1',
      type: SURVEY_RESPONSE_AGGREGATE_TYPE,
    };
  }

  createMany(instances: SurveyResponseRecord[]): Promise<void> {
    return this.base.createMany(instances);
  }

  update(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    return this.base.update(instance);
  }

  clear() {
    // @ts-expect-error TODO fix this
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.base.clear();
  }
}
