export type CoreDataTypeDecoratorOptions = {
  label: string;

  description: string;

  isOptional?: boolean;

  isArray?: boolean;
};

export type SimpleDataTypeDecoratorOptions = CoreDataTypeDecoratorOptions & {
  mustBeUnique?: boolean;
};
