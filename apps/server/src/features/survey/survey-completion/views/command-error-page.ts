import { TrueImpactError } from 'src/libs/data-types';
import { Section, TextContentNode, TIScreen } from 'src/libs/server-driven-ui';

interface CommandErrorPageProps {
  error: TrueImpactError;
  fsa: {
    type: string;
  };
}

export class CommandErrorPage {
  constructor(private readonly props: CommandErrorPageProps) {}

  render(): TIScreen {
    const screenId = `${this.props.fsa.type}_ERROR-MESSAGE`;

    const summaryNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: `${this.props.fsa.type} has failed with the following error message:`,
    };

    const messageNode: TextContentNode = {
      id: `${screenId}_1_2`,
      type: 'TEXT',
      text: `${this.props.error.message}`,
    };

    const section: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [summaryNode, messageNode],
    };

    const result: TIScreen = {
      id: screenId,
      title: `Update Failed`,
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
