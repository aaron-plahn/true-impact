import { isNumber } from './is-number';

export const isPositiveNumber = (input: unknown): input is number =>
  isNumber(input) && input > 0;
