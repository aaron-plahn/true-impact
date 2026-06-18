import { TrueImpactError } from './true-impact.error';

export class ResourceNotFoundError extends TrueImpactError {
  constructor({ type, id }: { type: string; id: string }) {
    const msg = `Resource: ${type}/${id} not found.`;

    super(msg);
  }
}
