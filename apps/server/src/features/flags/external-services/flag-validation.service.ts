import { Inject } from '@nestjs/common';
import { IFlagServiceForSurveyImports } from 'src/features/survey/survey-management';
import { TrueImpactError } from 'src/libs/data-types';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import { Flag } from '../models';
import type { IFlagCommandRepository } from '../repositories';

type LabelsAndOptionalDescriptions = {
  label: string;
  // required in case the flag does not yet exist
  description?: string;
};

// TODO rename this?
// TODO Is it circular to use the role interface from the dependent service here?
export class FlagValidationService implements IFlagServiceForSurveyImports {
  constructor(
    @Inject(FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly commandRepository: IFlagCommandRepository,
  ) {}

  /**
   * TODO how should we deal with descriptions ?
   */
  async upsertMany(
    labelsAndOptionalDescriptions: LabelsAndOptionalDescriptions[],
  ): Promise<(TrueImpactError | { id: string; label: string })[]> {
    const uniqueLabels = new Set<string>();

    const duplicateLabelErrors: TrueImpactError[] = [];

    for (const { label } of labelsAndOptionalDescriptions) {
      if (uniqueLabels.has(label)) {
        duplicateLabelErrors.push(
          new TrueImpactError(
            `Repeated label [${label}] in Flag upsert request.`,
          ),
        );
      } else {
        uniqueLabels.add(label);
      }
    }

    const results: (TrueImpactError | { id: string; label: string })[] = [];

    for (const { label, description } of labelsAndOptionalDescriptions) {
      const allFlags = await this.commandRepository.fetchMany();

      /**
       * TODO This is not an efficient way to do this search. When we implement
       * the actual repository, we will want to push the filters to the DB instead.
       *
       * But the event store is not really meant for such ad-hoc queries. A better pattern
       * might be to use the query model to construct the request and then allow the command \ repository to
       * reject invalid state transitions in case the view model is out of sync.
       */
      const searchResult = allFlags.filter((f) => f.label === label);

      // the given flag already exists
      if (searchResult.length > 0) {
        const existing = searchResult[0];

        if (!description || existing.description === description) {
          // The user has omitted the description for an existing flag, as expected or has provided a consistent description for an existing flag
          results.push({ id: existing.id as string, label });

          continue;
        }

        results.push(
          new TrueImpactError(
            `You cannot specify the description [${description}] for flag [${label}] as it already has the description [${existing.description}]`,
          ),
        );

        continue;
      }

      // the given flag does not yet exist
      if (!description) {
        results.push(
          new TrueImpactError(
            `You must provide a [description] when bulk creating the new flag [${label}].`,
          ),
        );

        continue;
      }

      // the user has provided a label \ description combo for a new flag, so we create this
      const buildResult = Flag.fromClientRequest({ label, description });

      if (buildResult instanceof Error) {
        results.push(buildResult);
      } else {
        /**
         * Note that it would be better to only create flags if every flag builds.
         * But given that some flags already exist and we need to maintain the orginally
         * indices in our results array, we have opted to eagerly persist successfully
         * built flags in order to keep the present algorithm simple.
         */
        const creationResult = await this.commandRepository.create(buildResult);

        results.push(
          creationResult instanceof Error
            ? creationResult
            : { id: creationResult.id, label },
        );
      }
    }

    return Promise.resolve(results);
  }

  exists(flagId: string): Promise<boolean> {
    const result = this.commandRepository.exists(flagId);

    return result;
  }
}
