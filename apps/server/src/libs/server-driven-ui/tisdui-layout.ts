type SectionId = string;

export interface TiSduiStackLayout {
  type: 'stack';
  items: SectionId[];
}

export type TiSduiLayout = TiSduiStackLayout;
