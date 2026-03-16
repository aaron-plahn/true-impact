import {
  appendMetadata,
  EnumeratedTypeSchemaPropertyMetadata,
} from './append-metadata';
import { CoreDataTypeDecoratorOptions } from './type-decorator-options';

export const ENUMERATED_TYPE = 'ENUMERATED_TYPE';

export function EnumeratedType(
  valuesAndLabels: Record<string, string>,
  userOptions: CoreDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const enumMeta: EnumeratedTypeSchemaPropertyMetadata = {
      type: ENUMERATED_TYPE,
      valuesAndLabels,
      isOptional: userOptions?.isOptional || false,
      label: userOptions.label,
      description: userOptions.description,
      enum: Object.values(valuesAndLabels),
    };

    appendMetadata(target, propertyKey, enumMeta);
  };
}
