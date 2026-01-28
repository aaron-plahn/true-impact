import { TrueImpactError } from "./true-impact.error";

export class TrueImpactBadUserInputError extends TrueImpactError {
  constructor(innerErrors: TrueImpactError[]) {
    super("Received an invalid user request.", innerErrors);
  }
}
