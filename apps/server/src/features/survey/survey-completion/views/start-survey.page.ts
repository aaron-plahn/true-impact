import { Section, TextContentNode, TIScreen } from 'src/libs/server-driven-ui';

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
      text: 'Hello World',
    };

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode],
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
