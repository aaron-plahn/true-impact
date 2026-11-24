import { TISduiFormField } from "./dynamic-form-field";

export interface CommandAction<T = unknown> {
  label: string;
  tooltip: string;
  // Deep Partial?
  context: Record<string, Partial<T>>;
  fields: TISduiFormField[];
}
