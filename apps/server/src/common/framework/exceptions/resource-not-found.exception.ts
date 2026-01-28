import { TrueImpactError } from '@true-impact/data-types';

export class ResourceNotFoundException extends TrueImpactError {
  constructor() {
    super(`Resource not found.`);
  }
}
