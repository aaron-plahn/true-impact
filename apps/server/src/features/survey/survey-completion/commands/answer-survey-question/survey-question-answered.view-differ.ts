import { Inject } from '@nestjs/common';
import { TISduiFormField } from 'src/libs/server-driven-ui/forms';
import {
  ActionContentNode,
  Section,
  TextContentNode,
} from '../../../../../libs/server-driven-ui';
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
        // questionLabel,
      },
    } = event;

    const { id } = aggregateCompositeIdentifier;

    const targetElementId = `surveys/attempts/${id}_1`;

    const existing = await this.queryRepo.fetchById(id);

    if (existing === null) {
      const errorTextNode: TextContentNode = {
        type: 'TEXT',
        id: `/surveys/responses/${id}/fetch-error/text`,
        text: `Failed to fetch survey [${id}]. No such survey response.`,
      };

      return {
        target: targetElementId,
        swap: 'outer',
        content: {
          id: `/surveys/responses/${id}/fetch-error`,
          type: 'PLAIN',
          classes: new Set(),
          nodes: [errorTextNode],
        },
      };
    }

    // TODO handle hasBeenCancelled
    const { nextQuestion, hasBeenSubmitted, name } = existing;

    if (hasBeenSubmitted) {
      const screenId = 'SUBMIT_SURVEY_ACKNOWLEDGEMENT';

      const textNode: TextContentNode = {
        id: `${screenId}_1_1`,
        type: 'TEXT',
        text: `Succesfully submitted survey: ${name}`,
      };

      const firstSection: Section = {
        id: `${screenId}_1`,
        type: 'PLAIN',
        classes: new Set(),
        nodes: [textNode],
      };

      return {
        target: `surveys/attempts/${id}_1`,
        swap: 'outer',
        content: firstSection,
      };
    }

    if (nextQuestion === null) {
      const screenId = `SUBMIT_SURVEY`;

      const submitSurveyAction: ActionContentNode = {
        // TODO Use a fragment compnent for this
        type: 'ACTION',
        id: `${screenId}_1_1`,
        title: `Submit Survey Response`,
        label: 'Submit Survey',
        description: `Submit a completed survey`,
        swap: 'outer',
        form: {
          fields: [],
          context: {
            aggregateCompositeIdentifier: {
              type: 'survey response record',
              id,
            },
          },
          action: {
            path: '/surveys/commands',
            method: 'POST',
            type: 'SUBMIT_SURVEY',
          },
        },
      };

      const firstSection: Section = {
        id: `${screenId}_1`,
        type: 'PLAIN',
        classes: new Set(),
        nodes: [submitSurveyAction],
      };

      return {
        target: `surveys/attempts/${id}_1`,
        swap: 'outer',
        content: firstSection,
      };
    }

    // we know that we have a next question to render
    const { label, prompt, options } = nextQuestion;

    const screenId = `surveys/attempts/${id}`;

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
            id,
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
      target: `surveys/attempts/${id}_1`,
      swap: 'outer',
      content: section,
    };
  }
}
