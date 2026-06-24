export const isObject = (input: unknown): input is object =>
  input !== null && typeof input === 'object';
