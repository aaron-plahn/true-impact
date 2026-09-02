import {
  ActionContentNode,
  Section,
  TextContentNode,
  TIScreen,
} from '../../../../libs/server-driven-ui';
import { TISduiFormField } from '../../../../libs/server-driven-ui/forms';
import { ActiveSurveyQuestionViewModelClientDto } from '../queries/survey-response-record.view-model';

interface SurveyQuestionCompletionPageProps {
  question: ActiveSurveyQuestionViewModelClientDto;
  attemptId: string;
}

export class SurveyQuestionCompletionPage {
  constructor(private readonly props: SurveyQuestionCompletionPageProps) {}

  render(): TIScreen {
    const {
      question: { label, prompt, options },
    } = this.props;

    const screenId = `surveys/attempts/${this.props.attemptId}`;

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
            id: this.props.attemptId,
          },
          questionLabel: this.props.question.label,
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

    const result: TIScreen = {
      id: screenId,
      title: `Question ${label}`,
      style: {},
      layoutsBySize: {
        s: {
          type: 'stack',
          items: [section.id],
        },
        l: {
          type: 'stack',
          items: [],
        },
      },
      classes: new Set(),
      sectionsById: {
        [section.id]: section,
      },
    };

    return result;
  }
}
