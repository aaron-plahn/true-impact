import {
  LinkContentNode,
  Section,
  TIScreen,
} from '../../../../libs/server-driven-ui';
import { TiSduiLayout } from '../../../../libs/server-driven-ui/tisdui-layout';
import { SurveyViewModelClientDto } from '../../queries/survey.view-model';

interface SurveyIndexPageProps {
  entities: SurveyViewModelClientDto[];
}

export class SurveyIndexPage {
  constructor(private readonly props: SurveyIndexPageProps) {}

  render(): TIScreen {
    const screenId = `SURVEY_PARTICIPATION_INDEX_LIST`;

    const linkNodes = this.props.entities.map(
      ({ id, name }): LinkContentNode => ({
        id: `${screenId}_item_${id}`,
        type: 'LINK',
        title: name,
        href: `/surveys/responses/begin/${id}`,
      }),
    );

    const firstSection: Section = {
      id: `${screenId}_1`,
      type: 'PLAIN',
      classes: new Set(),
      nodes: linkNodes,
    };

    const layout: TiSduiLayout = {
      type: 'stack',
      items: [firstSection.id],
    };

    const result: TIScreen = {
      id: screenId,
      title: 'Available Surveys',
      style: {},
      layoutsBySize: {
        s: layout,
        l: layout,
      },
      classes: new Set(),
      sectionsById: {
        [firstSection.id]: firstSection,
      },
    };

    return result;
  }
}
