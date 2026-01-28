export type DeepOverrides<T> = T extends object
  ? {
      [K in keyof T]?: DeepOverrides<T[K]>;
    }
  : unknown;
