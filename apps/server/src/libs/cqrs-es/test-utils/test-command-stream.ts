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
import { PersistenceAcknowledgement } from '../command-handler.interface';

interface IUpdateCommandPayload {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

/**
 * This helper manages a stream of commands targetting a single aggregate root (by `aggregateCompositeIdentifier`).
 * The first command provided will be treated as the creation command.
 */
export class TestCommandStream {
  private creationCommandFsa: ICommandFsa;

  private updateCommandFsas: ICommandFsa<IUpdateCommandPayload>[] = [];

  constructor(
    creationCommandFsa: ICommandFsa,
    updateCommandFsas: ICommandFsa<IUpdateCommandPayload>[],
  ) {
    this.creationCommandFsa = creationCommandFsa;

    this.updateCommandFsas = updateCommandFsas;
  }

  andThen<T extends IUpdateCommandPayload = IUpdateCommandPayload>(
    C: Ctor<T> & { type: string },
    overrides: DeepPartial<T> = {} as DeepPartial<T>,
  ) {
    const fsa = TestCommandStream.buildOne<T>(C, overrides);

    /**
     * Cloning on update allows hierarchical composition using
     * a builder pattern. This is the main point of this helper, as if
     * we complete the first 5 steps of set up for a given workflow, we
     * want to easily tack on the 6th in a separate test case.
     */
    const existing = this.updateCommandFsas.map((fsa) =>
      clonePlainObject(fsa, {}, []),
    );

    existing.push(fsa);

    return new TestCommandStream(this.creationCommandFsa, existing);
  }

  async execute(executor: {
    execute(
      fsa: ICommandFsa,
    ): Promise<PersistenceAcknowledgement | { message: string }>;
  }) {
    const allResults: [
      ICommandFsa,
      PersistenceAcknowledgement | { message: string },
    ][] = [];

    const creationResult = await executor.execute(this.creationCommandFsa);

    allResults.push([this.creationCommandFsa, creationResult]);

    if (typeof (creationResult as { message: string }).message === 'string') {
      return allResults;
    }

    const updateCommandFsasToExecute = this.as({
      id: (creationResult as PersistenceAcknowledgement).id,
      // type (on the ack?)
    });

    for (const fsa of updateCommandFsasToExecute) {
      const result = await executor.execute(fsa);

      allResults.push([fsa, result]);
    }

    return allResults;
  }

  getLast(): ICommandFsa | null {
    return this.updateCommandFsas.at(-1) || null;
  }

  size(): number {
    return this.updateCommandFsas.length + 1;
  }

  /**
   *
   * @param compositeIdOverrides Note that it is only necessary to override the `type` (aggregate type) property if testing a generic command that can target more than one aggregate type
   * @returns a command FSA stream where each command targets the given aggregate root by composite identifier
   */
  as(compositeIdOverrides: { type?: string; id: string }): ICommandFsa[] {
    return this.updateCommandFsas.map(({ type, payload }) => {
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

  getCreationCommand(): ICommandFsa {
    return clonePlainObject(this.creationCommandFsa, {}, []);
  }

  static first<T extends ICommandPayload = ICommandPayload>(
    C: Ctor<T> & { type: string },
    overrides: DeepPartial<T>,
  ): TestCommandStream {
    const creationCommandFsa = TestCommandStream.buildOne<T>(C, overrides);

    return new TestCommandStream(creationCommandFsa, []);
  }

  static buildOne<T extends ICommandPayload = ICommandPayload>(
    C: Ctor<T> & { type: string },
    overrides: DeepPartial<T>,
  ): ICommandFsa<T> {
    const payloadWithOverrides = buildTestInstance(C, overrides, {
      shouldValidate: true,
    });

    const fsa = {
      type: C.type,
      payload: payloadWithOverrides,
    };

    return fsa;
  }
}
