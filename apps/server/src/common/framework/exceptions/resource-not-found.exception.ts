import { TrueImpactError } from '@true-impact/data-types/error-handling';

export class ResourceNotFoundException extends TrueImpactError {
  constructor() {
    super(`Resource not found.`);
  }
}
