import { Inject } from '@nestjs/common';
import { Section, TextContentNode } from 'src/libs/server-driven-ui';
import type { ISurveyResponseQueryRepository } from '../queries';
import { SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN } from '../queries';
import { SduiDiffProducer, SDUIViewDiff } from './sdui-view-differ';
import { SurveySubmitted } from './survey-submitted.event';

export class SurveySubmittedViewDiffer implements SduiDiffProducer<SurveySubmitted> {
  constructor(
    @Inject(SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN)
    private readonly queryRepo: ISurveyResponseQueryRepository,
  ) {}

  async handle(e: SurveySubmitted): Promise<SDUIViewDiff> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id: attemptId },
      },
    } = e;

    const target = await this.queryRepo.fetchById(attemptId);

    if (!target) {
      return {
        target: 'SUBMIT_SURVEY_1',
        swap: 'outer',
        content: {
          id: 'SURVEY_SUBMITTED_VIEW_UPDATE_ERROR',
          type: 'PLAIN',
          classes: new Set(),
          nodes: [
            {
              id: 'SURVEY_SUBMITTED_VIEW_UPDATE_ERROR_1',
              type: 'TEXT',
              text: `Failed to update survey response ${attemptId} upon submission. No such response was found in the databse.`,
            },
          ],
        },
      };
    }

    const textNode: TextContentNode = {
      id: `survey_responses_${attemptId}_1_1`,
      type: 'TEXT',
      text: `Succesfully submitted survey: ${target.name}`,
    };

    const firstSection: Section = {
      id: `survey_responses_${attemptId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode],
    };

    return Promise.resolve({
      target: 'SUBMIT_SURVEY_1',
      swap: 'outer',
      content: firstSection,
    });
  }
}
