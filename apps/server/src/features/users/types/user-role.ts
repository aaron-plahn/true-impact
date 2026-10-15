import {
  CoreDataTypeDecoratorOptions,
  EnumeratedType,
} from 'src/libs/data-types';

export type UserRole = 'system admin' | 'tenant admin' | 'employee';

export const userRoleValuesAndLabels: { [K in UserRole]: string } = {
  'system admin': 'system admin',
  'tenant admin': 'team admin',
  employee: 'employee',
};

export const UserRoleEnumValuedProp = (
  userOptions: CoreDataTypeDecoratorOptions,
) => EnumeratedType(userRoleValuesAndLabels, userOptions);
