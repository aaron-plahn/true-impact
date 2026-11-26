/**
 * COPIED FROM SERVER
 * TODO synchronize these interfaces automatically
 */
export interface TISduiDatePicker {
  type: "DATE_PICKER";
  label: string;
  name: string;
  isRequired?: boolean;
}

export interface TISduiTextInput {
  type: "TEXT_INPUT";
  label: string;
  name: string;
  isRequired?: boolean;
}

// Input for a `string[]` valued prop
export interface TISduiMultipleTextInput {
  type: "MULTIPLE_TEXT_INPUT";
  label: string;
  name: string;
  isRequired?: boolean;
}

export interface TISduiSingleSelectInput {
  type: "SINGLE_SELECT_INPUT";
  label: string;
  name: string;
  isRequired?: boolean;
  options: {
    label: string;
    value: string;
  }[];
  //   default: string;
}

export interface TISduiDynamicSelector {
  type: "DYNAMIC_SELECTOR";
  label: string;
  name: string;
  isRequired?: boolean;
  /**
   * Note that the alternative is to have a `targetResourceType`
   * and make this a "primitive" from the client's point of view. This
   * might make it easier to implement caching in client-side state management, but
   * reduces the extensibility of the system.
   */
  path: string; // specifies search endpoint, relative to base
}

export type TISduiFormField =
  | TISduiDatePicker
  | TISduiTextInput
  | TISduiSingleSelectInput
  | TISduiDynamicSelector
  | TISduiMultipleTextInput;
