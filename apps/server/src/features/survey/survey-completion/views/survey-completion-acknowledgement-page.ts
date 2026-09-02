import {
  Section,
  TextContentNode,
  TIScreen,
} from '../../../../libs/server-driven-ui';

interface SurveyCompletionAcknowledgementPageProps {
  name: string;
}

export class SurveyCompletionAcknowledgementPage {
  constructor(
    private readonly props: SurveyCompletionAcknowledgementPageProps,
  ) {}

  render(): TIScreen {
    const screenId = 'SUBMIT_SURVEY_ACKNOWLEDGEMENT';

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: `Succesfully submitted survey: ${this.props.name}`,
    };

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode],
    };

    const result: TIScreen = {
      id: screenId,
      title: 'Survey Submitted Successfully',
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
