export class TrueImpactError extends Error {
  innerErrors: TrueImpactError[] = [];

  constructor(message: string, innerErrors?: TrueImpactError[]) {
    super(message);

    if (Array.isArray(innerErrors)) {
      this.innerErrors = innerErrors;
    }
  }

  protected buildCompleteErrorMessage() {
    const lines = [this.message, `See inner errors for more info.`];

    for (const e of this.innerErrors) {
      lines.push(e.buildCompleteErrorMessage());
    }

    return lines.join('\n');
  }

  toString() {
    return this.buildCompleteErrorMessage();
  }
}
