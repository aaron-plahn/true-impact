import { Section, TextContentNode, TIScreen } from 'src/libs/server-driven-ui';

interface CommandSuccessPageProps {
  commandType: string;
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
  revision: string;
}

export class CommandSuccessPage {
  constructor(private readonly props: CommandSuccessPageProps) {}

  render(): TIScreen {
    const screenId = this.props.commandType;

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      // TODO Use the command label here
      text: `${this.props.commandType} succeded. Loading updates.`,
    };

    const sectionId = `${screenId}_1`;

    const section: Section = {
      id: sectionId,
      type: 'PLAIN',
      classes: new Set(),
      nodes: [textNode],
    };

    // TODO (important) escape all user-sourced text to avoid injection attacks
    const result: TIScreen = {
      id: screenId,
      title: 'Update Succeeded',
      style: {},
      layoutsBySize: {
        s: {
          type: 'stack',
          items: [sectionId],
        },
        l: {
          type: 'stack',
          items: [],
        },
      },
      classes: new Set(),
      sectionsById: {
        [sectionId]: section,
      },
    };

    return result;
  }
}
