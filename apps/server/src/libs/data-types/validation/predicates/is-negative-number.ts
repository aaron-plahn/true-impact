import { isNumber } from './is-number';

export const isNegativeNumber = (input: unknown): input is number =>
  isNumber(input) && input < 0;
