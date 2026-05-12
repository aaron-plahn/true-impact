export interface TISduiTextInput {
  type: 'TEXT_INPUT';
  label: string;
  name: string;
}

export interface TISduiSingleSelectInput {
  type: 'SINGLE_SELECT_INPUT';
  label: string;
  name: string;
  options: {
    label: string;
    value: string;
  }[];
  //   default: string;
}

export type TISduiFormField = TISduiTextInput | TISduiSingleSelectInput;
