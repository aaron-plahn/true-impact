import {
  ActionContentNode,
  Section,
  TIScreen,
} from '../../../../libs/server-driven-ui';

interface SubmitSurveyPageProps {
  id: string; // survey ID
}

export class SubmitSurveyPage {
  id: string;

  name: string;

  constructor(private readonly props: SubmitSurveyPageProps) {}

  render(): TIScreen {
    const screenId = `SUBMIT_SURVEY`;

    const submitSurveyAction: ActionContentNode = {
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
            id: this.props.id,
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

    const result: TIScreen = {
      id: screenId,
      title: 'Submit Survey',
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
