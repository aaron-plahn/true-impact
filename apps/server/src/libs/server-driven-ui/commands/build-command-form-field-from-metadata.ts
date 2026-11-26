import {
  isArraySchemaPropertyMetadata,
  isEnumeratedTypeSchemaPropertyMetadata,
  isLiteralDataTypeMetadata,
  isLookupTablePropertyMetadata,
  isObjectSchemaPropertyMetadata,
  isSetPropertyMetadata,
  NON_EMPTY_STRING,
  SchemaPropertyMetadata,
} from '../../../libs/data-types';
import { TISduiFormField, TISduiTextInput } from '../forms';

export const buildCommandFormFieldFromMetadata = (
  propertyKey: string,
  metadataForProperty: SchemaPropertyMetadata,
): TISduiFormField => {
  if (
    isObjectSchemaPropertyMetadata(metadataForProperty) ||
    isEnumeratedTypeSchemaPropertyMetadata(metadataForProperty) ||
    isArraySchemaPropertyMetadata(metadataForProperty) ||
    isLookupTablePropertyMetadata(metadataForProperty) ||
    isSetPropertyMetadata(metadataForProperty) ||
    isLiteralDataTypeMetadata(metadataForProperty)
  ) {
    throw new Error(
      `Failed to generate dynamic form. Unsupported command property type [${metadataForProperty.type}] for property [${propertyKey}].`,
    );
  }

  if (metadataForProperty.type === NON_EMPTY_STRING) {
    const field: TISduiTextInput = {
      type: 'TEXT_INPUT',
      isRequired: !metadataForProperty.isOptional,
      label: metadataForProperty.label,
      name: propertyKey,
    };

    return field;
  }

  // TODO how to handle dynamic selection?

  // exhaustive check over simple data type valued fields
  throw new Error(
    `Failed to generate a form field for field: ${metadataForProperty.label}. Unsupported data type: ${metadataForProperty.type}`,
  );
};
