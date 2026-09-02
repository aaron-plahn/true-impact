import { Inject } from '@nestjs/common';
import { TISduiFormField } from 'src/libs/server-driven-ui/forms';
import {
  ActionContentNode,
  Section,
  TextContentNode,
} from '../../../../../libs/server-driven-ui';
import {
  type ISurveyResponseQueryRepository,
  SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN,
} from '../../queries';
import { SDUIViewDiff } from '../sdui-view-differ';
import { SurveyBegan } from './survey-began.event';

export class SurveyBeganViewDiffer {
  constructor(
    @Inject(SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN)
    private readonly queryRepo: ISurveyResponseQueryRepository,
  ) {}

  async handle(event: SurveyBegan): Promise<SDUIViewDiff> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id: attemptId },
      },
    } = event;

    // TODO check if the survey attempt has been cancelled

    const responseView = await this.queryRepo.fetchById(attemptId);

    /**
     * TODO We need to put some thought to whether the renderers should be aware of which element
     * is being replaced. Also, are there cases where we replace the entire screen?
     *
     * Identity as it applies to partial updates is an interesting topic in general. HTMX uses css selectors to
     * specify a target, whereas the corresponding mobile framework strictly uses IDs. The downside of using selectors is that
     * there is not always obvious which element is being targetted for replacement or update.
     */
    const targetElementId = `BEGIN_SURVEY`;

    if (responseView === null) {
      const errorTextNode: TextContentNode = {
        type: 'TEXT',
        id: `/surveys/responses/${attemptId}/fetch-error/text`,
        text: `Failed to fetch survey [${attemptId}]. No such survey response.`,
      };

      return {
        target: targetElementId,
        swap: 'outer',
        content: {
          id: `/surveys/responses/${attemptId}/fetch-error`,
          type: 'PLAIN',
          classes: new Set(),
          nodes: [errorTextNode],
        },
      };
    }

    // this is a system error. it shouldn't happen, but we've added this just in case
    if (responseView.nextQuestion === null) {
      const errorTextNode: TextContentNode = {
        type: 'TEXT',
        id: `/surveys/responses/${attemptId}/fetch-error/text`,
        text: `Failed to fetch first question for [${attemptId}]. No next question was found.`,
      };

      return {
        target: targetElementId,
        swap: 'outer',
        content: {
          id: `/surveys/responses/${attemptId}/fetch-error`,
          type: 'PLAIN',
          classes: new Set(),
          nodes: [errorTextNode],
        },
      };
    }

    const { nextQuestion } = responseView;

    // we know that we have a next question to render
    const { label, prompt, options } = nextQuestion;

    const screenId = `surveys/attempts/${attemptId}`;

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: prompt,
    };

    const selectOptions = Array.from(Object.values(options)).map((o) => ({
      value: o.label,
      label: o.text,
    }));

    const field: TISduiFormField = {
      name: 'chosenOptionLabel',
      type: 'SINGLE_SELECT_INPUT',
      label: label,
      options: selectOptions,
    };

    const actionNode: ActionContentNode = {
      type: 'ACTION',
      id: `${screenId}_1_2`,
      title: 'Choose one of the following options:',
      label: 'Submit',
      description: 'Submit your response to this question',
      form: {
        /**
         * The only field for this form is a single, multiple choice input.
         */
        fields: [field],
        context: {
          aggregateCompositeIdentifier: {
            type: 'survey response record',
            id: attemptId,
          },
          questionLabel: nextQuestion.label,
        },
        action: {
          path: 'surveys/commands-html',
          method: 'POST',
          type: 'ANSWER_SURVEY_QUESTION',
        },
      },
      swap: 'outer',
    };

    const section: Section = {
      id: `${screenId}_1`,
      type: '',
      classes: new Set(),
      nodes: [textNode, actionNode],
    };

    return {
      target: targetElementId,
      swap: 'outer',
      content: section,
    };
  }
}
