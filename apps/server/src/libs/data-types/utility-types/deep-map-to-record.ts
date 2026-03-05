export type MapToRecord<M extends Map<any, any>> =
  M extends Map<infer K extends string, infer V> ? Record<K, V> : never;

export type DeepMapToRecord<M extends Map<any, any>> =
  M extends Map<infer K extends string, infer V>
    ? V extends Map<any, any>
      ? Record<K, DeepMapToRecord<V>>
      : Record<K, V>
    : never;
