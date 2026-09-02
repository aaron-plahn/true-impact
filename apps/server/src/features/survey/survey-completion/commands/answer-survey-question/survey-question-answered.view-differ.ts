import { Inject } from '@nestjs/common';
import { LinkContentNode, Section } from '../../../../../libs/server-driven-ui';
import type { ISurveyResponseQueryRepository } from '../../queries';
import { SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN } from '../../queries';
import { SDUIViewDiff } from '../sdui-view-differ';
import { SurveyQuestionAnswered } from './survey-question-answered.event';

// TODO @ViewDiffer(...)
export class SurveyQuestionAnsweredViewDiffer {
  constructor(
    @Inject(SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN)
    private readonly queryRepo: ISurveyResponseQueryRepository,
  ) {}

  async handle(event: SurveyQuestionAnswered): Promise<SDUIViewDiff> {
    const {
      payload: {
        aggregateCompositeIdentifier,
        // chosenOptionLabel,
        questionLabel,
      },
    } = event;

    const { id } = aggregateCompositeIdentifier;

    const _existing = await this.queryRepo.fetchById(id);

    // const nextQuestion = existing?.nextQuestion;

    const linkNode: LinkContentNode = {
      type: 'LINK',
      id: `link_to_next_for_survey_${id}_q_${questionLabel}`,
      title: 'NEXT',
      href: `/surveys/responses/participate/${id}`,
    };

    const sdui: Section = {
      id: `link_to_next_for_${id}`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [linkNode],
    };

    return {
      target: `surveys/attempts/${id}_1`,
      swap: 'outer',
      content: sdui,
    };
  }
}
