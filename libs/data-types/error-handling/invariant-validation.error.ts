import { Ctor } from "../utility-types";
import { TrueImpactError } from "./true-impact.error";

export class InvariantValidationError extends TrueImpactError {
  constructor(ctor: Ctor, innerErrors: TrueImpactError[]) {
    super(
      `Encountered an ill-formed entity of type: ${ctor.name}`,
      innerErrors,
    );
  }
}
