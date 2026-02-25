export const isNumber = (input: unknown): input is number => {
  // TODO what about bigint?
  return typeof input === 'number' && !Number.isNaN(input);
};
