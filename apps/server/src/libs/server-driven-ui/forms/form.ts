import { TISduiFormField } from './form-field';

export interface TISduiForm {
  id: string;
  title: string;
  fields: TISduiFormField[];
  // this is meant to appear as the label on the submission button
  label: string;
  // this is meant to appear as a tooltip
  description: string;
  action: {
    path: string;
    method: 'POST';
  };
}
