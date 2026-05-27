import {
  ActionContentNode,
  Section,
  TIScreen,
} from 'src/libs/server-driven-ui';

export interface OpenSurveyToAnonymousIndividualPageProps {
  surveyId: string;
}

/**
 * Note that this isn't currently used because the act of openning the survey
 * is performed in the core admin (React) client.
 */
export class OpenSurveyToAnonymousIndividualPage {
  constructor(
    private readonly props: OpenSurveyToAnonymousIndividualPageProps,
  ) {}

  render(): TIScreen {
    const screenId = `OPEN_SURVEY_TO_ANONYMOUS_INDIVIDUAL`;

    const openSurveyAction: ActionContentNode = {
      type: 'ACTION',
      id: '',
      title: '',
      label: '',
      description: '',
      form: {
        fields: [],
        context: {
          aggregateCompositeIdentifier: {
            type: 'survey response record',
            id: this.props.surveyId,
          },
        },
        action: {
          path: '/surveys/commands',
          method: 'POST',
          type: 'SUBMIT_SURVEY',
        },
      },
      swap: 'outer',
    };

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [openSurveyAction],
    };

    const result: TIScreen = {
      id: screenId,
      title: 'Open Survey for Anonymous Completion',
      style: {},
      layoutsBySize: {
        s: {
          type: 'stack',
          items: [firstSection.id],
        },
        l: {
          type: 'stack',
          items: [firstSection.id],
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
