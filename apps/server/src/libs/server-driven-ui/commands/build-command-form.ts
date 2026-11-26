import { ICommandPayload } from 'src/libs/cqrs-es';
import {
  Ctor,
  getDataSchemaFromClassCtor,
  SchemaPropertyMetadata,
} from '../../../libs/data-types';
import { TISduiDynamicSelector, TISduiFormField } from '../forms';
import { buildCommandFormFieldFromMetadata } from './build-command-form-field-from-metadata';
import { getDynamicSelectionMetadata } from './decorators';
import { TISduiCommand } from './sdui-command';

type CommandMetadata = {
  label: string;
  description: string;
};

export const buildCommandForm = <TPayload extends ICommandPayload>(
  ctor: Ctor<TPayload> & { type: string },
  commandEndpoint: string,
  context: Partial<TPayload>,
  // TODO use reflection or static properties to get this
  commandMetadata: CommandMetadata,
): TISduiCommand => {
  /**
   * We might want to have a separate function that takes the schema in directly.
   * We will probably want to cache the schemas for performance. This operation
   * will happen on every "detail" query in the system.
   */
  const schema = getDataSchemaFromClassCtor(ctor);

  const dynamicSelectionMetadata = getDynamicSelectionMetadata(ctor);

  // TODO getCommandMetadata -> label, description

  const fields: TISduiFormField[] = [];

  Object.entries(schema.properties).forEach(
    ([propertyKey, propertyMetadata]) => {
      if (propertyKey in context) {
        /**
         * For all update commands, we bind `aggregateCompositeIdentifier` from context.
         * So we don't need to generate a form field for this property, for example.
         */
        return;
      }

      /**
       * In this case, we don't want to generate a form field based on the property's data type, but simply
       * wire up a dynamic selector element.
       */
      if (propertyKey in dynamicSelectionMetadata) {
        const { path } = dynamicSelectionMetadata[propertyKey];

        /**
         * We should sort out the interaction between dynamic selector fields and the corresponding property data type metadata.
         * For now, we assume that dynamic selections are required to be completed unless the property metadata explicitly
         * states otherwise.
         */
        const isRequired =
          'isRequired' in propertyMetadata
            ? (propertyMetadata as { isRequired: boolean }).isRequired
            : true;

        const field: TISduiDynamicSelector = {
          type: 'DYNAMIC_SELECTOR',
          // TODO sort out the interaction of this with the property metadata
          isRequired,
          // TODO constrain the @DynamicallySelected decorator to only target fields with appropriate data types
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          label: propertyMetadata.label,
          name: propertyKey,
          path,
        };

        fields.push(field);

        return;
      }

      const field: TISduiFormField = buildCommandFormFieldFromMetadata(
        propertyKey,
        propertyMetadata as SchemaPropertyMetadata,
      );

      fields.push(field);
    },
  );

  //   The `type` (command type) is a static property on the command class
  const { type: commandType } = ctor;

  const tisduiCommand: TISduiCommand = {
    type: 'COMMAND',
    commandType,
    label: commandMetadata.label,
    tooltip: commandMetadata.description,
    context,
    fields,
    method: 'POST',
    path: commandEndpoint,
  };

  return tisduiCommand;
};
