import { TISduiFormField } from './form-field';

export interface TISduiForm {
  fields: TISduiFormField[];
  context: Record<string, unknown>;
  action: {
    path: string;
    method: 'POST';
  };
}
