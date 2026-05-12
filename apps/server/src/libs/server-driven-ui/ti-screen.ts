import { ScreenSize } from './screen-size';
import { Section } from './section';

export interface TIScreen {
  id: string;
  title: string;
  style: Record<string, unknown>;
  layoutsBySize: Record<ScreenSize, unknown>;
  classes: Set<string>;
  sectionsById: Record<string, Section>;
}
