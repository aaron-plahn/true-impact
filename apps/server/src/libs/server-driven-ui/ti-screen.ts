import { ScreenSize } from './screen-size';
import { Section } from './section';
import { TiSduiLayout } from './tisdui-layout';

export interface TIScreen {
  id: string;
  title: string;
  style: Record<string, unknown>;
  layoutsBySize: Record<ScreenSize, TiSduiLayout>;
  classes: Set<string>;
  sectionsById: Record<string, Section>;
}
