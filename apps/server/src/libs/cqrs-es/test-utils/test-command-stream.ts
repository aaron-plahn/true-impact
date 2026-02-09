import {
  buildTestInstance,
  clonePlainObject,
  Ctor,
  DeepPartial,
} from '../../../libs/data-types';
import {
  ICommandFsa,
  ICommandPayload,
} from '../command-flux-standard-action.interface';

export class TestCommandStream {
  private stream: ICommandFsa[] = [];

  constructor(stream: ICommandFsa[]) {
    this.stream = stream;
  }

  andThen<T extends ICommandPayload>(
    C: Ctor<T> & { type: string },
    overrides: DeepPartial<T>,
  ) {
    const payloadWithOverrides = buildTestInstance(C, overrides);

    const fsa = {
      type: C.type,
      payload: payloadWithOverrides,
    };

    /**
     * Cloning on update allows hierarchical composition using
     * a builder pattern. This is the main point of this helper, as if
     * we complete the first 5 steps of set up for a given workflow, we
     * want to easily tack on the 6th in a separate test case.
     */
    const existing = this.stream.map((fsa) =>
      clonePlainObject(fsa, {}),
    ) as ICommandFsa[];

    existing.push(fsa);

    return new TestCommandStream(existing);
  }

  /**
   *
   * @param compositeIdOverrides Note that it is only necessary to override the `type` (aggregate type) property if testing a generic command that can target more than one aggregate type
   * @returns a command FSA stream where each command targets the given aggregate root by composite identifier
   */
  as(compositeIdOverrides: { type?: string; id: string }): ICommandFsa[] {
    return this.stream.map(({ type, payload }) => {
      const aggregateCompositeIdentifierWithOverridesApplied = {
        type:
          compositeIdOverrides.type ||
          payload.aggregateCompositeIdentifier.type,
        id: compositeIdOverrides.id,
      };

      const payloadWithOverrides = clonePlainObject(
        payload,
        {
          aggregateCompositeIdentifier:
            aggregateCompositeIdentifierWithOverridesApplied,
        },
        [],
      );

      return {
        type,
        payload: payloadWithOverrides,
      };
    });
  }

  static first<T extends ICommandPayload>(
    C: Ctor<T> & { type: string },
    overrides: DeepPartial<T>,
  ): TestCommandStream {
    return new TestCommandStream([]).andThen(C, overrides);
  }
}
