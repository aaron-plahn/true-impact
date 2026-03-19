import { Ctor } from '../../utility-types';
import { appendMetadata, LookupTablePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

type GetCtor = () => Ctor;

export function LookupTable(
  type: GetCtor | 'string' | 'integer' | 'number' | 'boolean',
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const meta: LookupTablePropertyMetadata = {
      type: 'lookup-table-object',
      label: userOptions.label,
      description: userOptions.description,
      valueType: type,
    };

    appendMetadata(target, propertyKey, meta);
  };
}
