import {
  EnumeratedType,
  getDataSchemaFromClassCtor,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
} from '../../schema-management/decorators';
import { convertToOpenApiSchema } from './convert-to-open-api-schema';

const buildPropertyMeta = (propertyName: string) => ({
  label: propertyName,
  description: `description for property [${propertyName}]`,
});

class Widget {
  @NonEmptyString(buildPropertyMeta('count'))
  count: number;

  @NonEmptyString({
    ...buildPropertyMeta('label'),
    isOptional: true,
  })
  label?: string;

  @NonNegativeInteger({
    ...buildPropertyMeta('ratings'),
    isArray: true,
    isOptional: false, // i.e., cannot be empty
  })
  ratings: number[];
}

enum GadgetClass {
  premium = 'PREM',
  midGrade = 'MID',
  cheap = 'BUCKORTWO',
}

class Gadget {
  @NonEmptyString(buildPropertyMeta('id'))
  id: string;

  @EnumeratedType(GadgetClass, buildPropertyMeta('class'))
  class: GadgetClass;

  @NonNegativeInteger(buildPropertyMeta('priority'))
  priority: number;

  @NestedDataType(() => Widget, buildPropertyMeta('main widget'))
  mainWidget: Widget;

  @NestedDataType(() => Widget, {
    ...buildPropertyMeta('secondary widget'),
    isOptional: true,
  })
  secondaryWidget?: Widget;
}

describe(`convertToOpenApiSchema`, () => {
  describe(`when given the schema for a test class`, () => {
    it(`should return the expected Open API schema`, () => {
      const internalSchema = getDataSchemaFromClassCtor(Gadget);

      const result = convertToOpenApiSchema(internalSchema);

      expect(result).toMatchSnapshot();
    });
  });
});
