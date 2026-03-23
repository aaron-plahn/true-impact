import { Ctor } from '../../utility-types';
import { appendMetadata, LookupTablePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

type GetCtor = () => Ctor;

type LookupTableDecoratorUserOptions = SimpleDataTypeDecoratorOptions & {
  depth?: number;
};

export function LookupTable(
  type: GetCtor | 'string' | 'integer' | 'number' | 'boolean',
  userOptions: LookupTableDecoratorUserOptions,
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const meta: LookupTablePropertyMetadata = {
      type: 'lookup-table-object',
      label: userOptions.label,
      description: userOptions.description,
      valueType: type,
      /**
       * Sometimes we want a multi-step lookup table. A 1 step lookup table
       * has TypeScript type `Record<string,Record<string,TData>>`.
       */
      depth: userOptions?.depth || 1,
    };

    appendMetadata(target, propertyKey, meta);
  };
}
