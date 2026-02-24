import { TrueImpactError } from '../../../libs/data-types';

export class ResourceNotFoundException extends TrueImpactError {
  constructor() {
    super(`Resource not found.`);
  }
}
