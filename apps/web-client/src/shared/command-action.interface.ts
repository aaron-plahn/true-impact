import { TISduiFormField } from "./dynamic-form-field";

export interface TISduiCommand<T = unknown> {
  type: "COMMAND";
  commandType: string;
  label: string;
  tooltip: string;
  // Deep Partial?
  context: Record<string, Partial<T>>;
  fields: TISduiFormField[];
  method: "POST";
  path: string; // relative to base
}
