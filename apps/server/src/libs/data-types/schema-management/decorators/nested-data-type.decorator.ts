import { Ctor } from '../../utility-types';
import {
  appendMetadata,
  ArraySchemaPropertyMetadata,
  ObjectSchemaPropertyMetadata,
} from './append-metadata';
import { CoreDataTypeDecoratorOptions } from './type-decorator-options';

export function NestedDataType(
  getNestedCtor: () => Ctor,
  userOptions: CoreDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const objectMeta: ObjectSchemaPropertyMetadata = {
      type: 'object',
      isOptional: userOptions?.isOptional || false,
      label: userOptions.label,
      description: userOptions.description,
      getCtor: getNestedCtor,
    };

    if (userOptions.isArray) {
      const fullMeta: ArraySchemaPropertyMetadata = {
        type: 'array',
        canBeEmpty: userOptions.isOptional || false,
        label: userOptions.label,
        description: userOptions.description,
        items: {
          type: 'object',
          getCtor: getNestedCtor,
        },
      };

      appendMetadata(target, propertyKey, fullMeta);

      return;
    }

    appendMetadata(target, propertyKey, objectMeta);
  };
}
