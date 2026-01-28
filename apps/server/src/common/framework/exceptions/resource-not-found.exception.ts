import { TrueImpactError } from 'src/libs';

export class ResourceNotFoundException extends TrueImpactError {
  constructor() {
    super(`Resource not found.`);
  }
}
