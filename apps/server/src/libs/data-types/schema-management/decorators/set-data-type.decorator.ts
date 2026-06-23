import {
  appendMetadata,
  SetDecoratorElementType,
  SetPropertyMetadata,
} from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export function SetDataType(
  elementType: SetDecoratorElementType,
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const meta: SetPropertyMetadata = {
      type: 'set',
      label: userOptions.label,
      description: userOptions.description,
      valueType: elementType,
    };

    appendMetadata(target, propertyKey, meta);
  };
}
