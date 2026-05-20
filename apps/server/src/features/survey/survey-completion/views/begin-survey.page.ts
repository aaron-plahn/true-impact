import {
  ActionContentNode,
  Section,
  TextContentNode,
  TIScreen,
} from 'src/libs/server-driven-ui';

export class BeginSurveyPage {
  id: string;

  name: string;

  // TODO call these `props` collectively
  constructor({ id, name }: { id: string; name: string }) {
    this.id = id;

    this.name = name;
  }

  render(): TIScreen {
    const screenId = `BEGIN_SURVEY`;

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: 'Complete Survey',
    };

    // TODO inject the command metadata and use that here
    const beginSurveyAction: ActionContentNode = {
      type: 'ACTION',
      id: `BEGIN_SURVEY_${this.id}`,
      title: 'Begin Survey',
      label: 'Begin',
      description: 'Begin a new attempt of the given survey',
      swap: 'outer',
      form: {
        fields: [],
        context: {
          surveyId: this.id,
        },
        action: {
          path: '/surveys/commands',
          method: 'POST',
          type: 'BEGIN_SURVEY',
        },
      },
    };

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode, beginSurveyAction],
    };

    const result: TIScreen = {
      id: screenId,
      title: 'Begin Survey',
      style: {},
      layoutsBySize: {
        s: {
          type: 'stack',
          items: [firstSection.id],
        },
        l: {
          type: 'stack',
          items: [],
        },
      },
      classes: new Set(),
      sectionsById: {
        [firstSection.id]: firstSection,
      },
    };

    return result;
  }
}
