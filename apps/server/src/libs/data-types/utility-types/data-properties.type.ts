/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type DataProperties<TInstance> = {
  [P in keyof TInstance as TInstance[P] extends Function
    ? never
    : P]: TInstance[P] extends Function ? never : TInstance[P];
};
