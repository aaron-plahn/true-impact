import { isNumber } from './is-number';

export const isInteger = (input: unknown): input is number => {
  if (!isNumber(input)) {
    return false;
  }

  return Number.isInteger(input);
};
