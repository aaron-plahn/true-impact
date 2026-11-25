import { ClientViewModel } from 'src/features/clients/queries';
import { TISduiFormField } from '../forms';

export interface TISduiCommand<T = unknown> {
  type: 'COMMAND';
  commandType: string;
  label: string;
  tooltip: string;
  // Deep Partial?
  context: Record<string, Partial<T>>;
  fields: TISduiFormField[];
  method: 'POST';
  path: string; // relative to base
}

export const createClientTISduiCommand: TISduiCommand<ClientViewModel> = {
  type: 'COMMAND',
  commandType: 'CREATE_CLIENT',
  method: 'POST',
  path: '/clients/commands',
  label: 'CREATE_CLIENT',
  tooltip: 'Add a new client to the system',
  context: {},
  fields: [
    {
      type: 'TEXT_INPUT',
      label: 'First Name',
      name: 'firstName',
      isRequired: true,
    },
    {
      type: 'TEXT_INPUT',
      label: 'Middle Names',
      name: 'middleNames',
      isRequired: false,
    },
    {
      type: 'TEXT_INPUT',
      label: 'Last Name',
      name: 'lastName',
      isRequired: true,
    },
    {
      type: 'DATE_PICKER',
      label: 'DOB',
      name: 'dateOfBirth',
      isRequired: true,
    },
    {
      type: 'SINGLE_SELECT_INPUT',
      label: 'Is Indigenous?',
      name: 'isIndigenous',
      isRequired: true,
      options: [
        {
          label: 'yes',
          value: 'Yes',
        },
        {
          label: 'no',
          value: 'No',
        },
        {
          label: 'unknown',
          value: 'Unknown',
        },
      ],
    },
    {
      type: 'DYNAMIC_SELECTOR',
      label: '',
      name: '',
      isRequired: false,
      path: '/communities/search',
    },
  ],
};
