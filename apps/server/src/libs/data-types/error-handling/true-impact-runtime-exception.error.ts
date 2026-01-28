import { TrueImpactError } from './true-impact.error';

/**
 * The following represents an error from which we cannot recover from, i.e., cause to "panic". This should only be used in exception cases,
 * for example, when a property is required to exist by run-time validation and yet it is not there. Do not throw for recoverable errors
 * such as bad user input. We do not want to break the control flow of our application unless it is logically impossible to proceed.
 */
export class TrueImpactRuntimeException extends TrueImpactError {
  constructor(innerErrors: TrueImpactError[]) {
    super(
      `The server has encountered an unexpected situation from which it cannot recover. Please share the following information with your system administrator`,
      innerErrors,
    );
  }
}
