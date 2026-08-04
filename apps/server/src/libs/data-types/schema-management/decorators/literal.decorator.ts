import { appendMetadata, LiteralDataTypeMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export function Literal(
  value: string | boolean | number,
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const metadata: LiteralDataTypeMetadata = {
      ...userOptions,
      value,
      type: 'LITERAL',
      isOptional: userOptions.isOptional || false,
      isArray: userOptions.isArray || false,
      // The only way a literal can be unique is if it is part of a singleton
      mustBeUnique: false,
    };

    appendMetadata(target, propertyKey, metadata);
  };
}
