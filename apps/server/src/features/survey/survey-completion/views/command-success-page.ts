import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import { Section, TextContentNode, TIScreen } from 'src/libs/server-driven-ui';

export class CommandSuccessPage {
  constructor(private readonly response: PersistenceAcknowledgement) {}

  render(): TIScreen {
    const screenId = 'COMMAND_SUCCESS'; // `${this.response.type}/${this.response.id}/${this.response.revision}`;

    const textNode: TextContentNode = {
      id: `${screenId}_1_1`,
      type: 'TEXT',
      text: `${this.response.type} succeded. Loading updates.`,
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
        s: {},
        l: {},
      },
      classes: new Set(),
      sectionsById: {
        [sectionId]: section,
      },
    };

    return result;
  }
}
