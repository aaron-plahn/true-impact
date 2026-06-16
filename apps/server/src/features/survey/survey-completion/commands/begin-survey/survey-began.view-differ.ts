import { LinkContentNode, Section } from '../../../../../libs/server-driven-ui';
import { SDUIViewDiff } from '../sdui-view-differ';
import { SurveyBegan } from './survey-began.event';

export class SurveyBeganViewDiffer {
  async handle(event: SurveyBegan): Promise<SDUIViewDiff> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id: attemptId },
      },
    } = event;

    const beginSurveyLink: LinkContentNode = {
      type: 'LINK',
      id: `to_survey_attempt_${attemptId}`,
      title: `GO`,
      href: `/surveys/responses/participate/${attemptId}`,
    };

    const newSection: Section = {
      id: `link_to_survey_attemnpt_${attemptId}`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [beginSurveyLink],
    };

    return Promise.resolve({
      target: 'BEGIN_SURVEY',
      swap: 'outer',
      content: newSection,
    });
  }
}
