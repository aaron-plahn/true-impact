import { TISduiFormField } from './form-field';

export interface TISduiForm {
  fields: TISduiFormField[];
  context: Record<string, unknown>;
  action: {
    path: string;
    method: 'POST';
    /**
     * For now, actions are assumed to be commands. The following is the system command type, e.g., "WIDGET_CREATED".
     */
    type: string;
  };
}
