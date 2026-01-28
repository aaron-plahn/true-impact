import { TrueImpactError } from '../../../libs';

export class ResourceNotFoundException extends TrueImpactError {
  constructor() {
    super(`Resource not found.`);
  }
}
