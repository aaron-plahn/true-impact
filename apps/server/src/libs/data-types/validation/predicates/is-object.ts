export const isObject = (input: unknown): input is object =>
  // Note that currently this classifies arrays as objects
  input !== null && typeof input === 'object';
