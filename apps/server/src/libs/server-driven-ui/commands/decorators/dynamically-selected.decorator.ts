import { Ctor } from 'src/libs/data-types';

export interface DynamicSelectionMetadata {
  path: string; // relative to base
  // `name`, `isRequired` come from the core property schema
}

const DYNAMIC_SELECTION_METADATA_KEY = '__DYNAMIC_SELECTION_METADATA__';

export const getDynamicSelectionMetadata = (
  target: Ctor<unknown>,
): Record<string, DynamicSelectionMetadata> => {
  const proto = target.prototype as object;

  if (!proto) {
    return {};
  }

  const existingMeta =
    (Reflect.get(proto, DYNAMIC_SELECTION_METADATA_KEY) as Record<
      string,
      DynamicSelectionMetadata
    >) || {};

  return existingMeta;
};

export function DynamicallySelected(
  metadata: DynamicSelectionMetadata,
): PropertyDecorator {
  return (target: Ctor<unknown>, propertyKey: string | symbol) => {
    const existingMeta = getDynamicSelectionMetadata(target);

    if (propertyKey in existingMeta) {
      return;
    }

    Object.assign(existingMeta, {
      [propertyKey]: metadata,
    });

    Reflect.set(target, DYNAMIC_SELECTION_METADATA_KEY, existingMeta);
  };
}
