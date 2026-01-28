import { DataProperties } from "./data-properties.type";

export type DataKeys<TInstance> = TInstance extends never
  ? keyof {}
  : keyof DataProperties<TInstance>;
