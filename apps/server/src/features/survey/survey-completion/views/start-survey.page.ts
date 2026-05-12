import {
  ActionContentNode,
  Section,
  TextContentNode,
  TIScreen,
} from 'src/libs/server-driven-ui';
import { TISduiFormField } from 'src/libs/server-driven-ui/forms';

export class StartSurveyPage {
  id: string;

  name: string;

  constructor({ id, name }: { id: string; name: string }) {
    this.id = id;

    this.name = name;
  }

  render(): TIScreen {
    const screenId = `BEGIN_SURVEY_${this.id}`;

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: 'Complete Survey',
    };

    const textField: TISduiFormField = {
      type: 'TEXT_INPUT',
      label: 'Survey ID',
      name: 'surveyId',
    };

    const beginSurveyAction: ActionContentNode = {
      type: 'ACTION',
      id: `${screenId}_1_2`,
      title: 'Begin Survey',
      label: 'Begin',
      description: 'Begin a new attempt of the given survey',
      form: {
        fields: [textField],
        context: {},
        action: {
          path: '/surveys/commands',
          method: 'POST',
        },
      },
    };

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode, beginSurveyAction],
    };

    // TODO escape all text
    const result: TIScreen = {
      id: screenId,
      title: 'Begin Survey',
      style: {},
      layoutsBySize: {
        s: {},
        l: {},
      },
      classes: new Set(),
      sectionsById: {
        [firstSection.id]: firstSection,
      },
    };

    return result;
  }
}
