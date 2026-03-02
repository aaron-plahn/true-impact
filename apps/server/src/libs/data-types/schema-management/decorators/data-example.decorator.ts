import { plainToClass } from 'class-transformer';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../error-handling';
import { Ctor, DeepPartial } from '../../utility-types';

interface FromPersistenceDto<TDto = unknown, UInstance = unknown> {
  fromPersistenceDto(
    dto: TDto,
    shouldValidate?: boolean,
  ): UInstance | TrueImpactError;
}

const isFromPersistenceDto = <T = unknown>(
  input: unknown,
): input is FromPersistenceDto<T> =>
  input !== null &&
  typeof input !== 'undefined' &&
  typeof (input as FromPersistenceDto).fromPersistenceDto === 'function';

export interface TrueImpactDataExampleOptions<TPeristenceDto = unknown> {
  example: TPeristenceDto;
}

const TRUE_IMPACT_DATA_EXAMPLE_METADATA =
  '__TRUE_IMPACT_DATA_EXAMPLE_METADATA__';

type TrueImpactDataExampleMetadata<TPeristenceDto = unknown> = {
  examples: Map<string, TPeristenceDto>;
};

export const buildTestInstance = <
  TPersistenceDto = unknown,
  UInstance = unknown,
>(
  ctor: Ctor<UInstance> & FromPersistenceDto<TPersistenceDto, UInstance>,
  overrides?: DeepPartial<TPersistenceDto>,
  shouldValidate = true,
): UInstance => {
  const dataExampleMetadata = Reflect.get(
    ctor,
    TRUE_IMPACT_DATA_EXAMPLE_METADATA,
  ) as TrueImpactDataExampleMetadata;

  if (!dataExampleMetadata || !dataExampleMetadata.examples.has('default')) {
    throw new Error(
      `You need to register at least one data example as follows.\n@TrueImpactDataExample<TDto,${ctor.name}>({ example: {...}})\nclass ${ctor.name}{...}`,
    );
  }

  const defaultDto = dataExampleMetadata.examples.get(
    'default',
  ) as TPersistenceDto;

  const dtoWithOverridesApplied = JSON.parse(
    JSON.stringify({
      ...defaultDto,
      ...(overrides || {}),
    }),
  ) as TPersistenceDto;

  if (!isFromPersistenceDto(ctor)) {
    // throw new Error(
    //   `You need to add a static factory method as follows.\nclass ${ctor.name}{\nstatic fromPersistenceDto(dto: YourDtoType): ${ctor.name} | TrueImpactError{...}\n}`,
    // );

    return plainToClass(ctor, dtoWithOverridesApplied);
  }

  const result = ctor.fromPersistenceDto(
    dtoWithOverridesApplied,
    shouldValidate,
  );

  if (result instanceof TrueImpactError) {
    throw new TrueImpactRuntimeException([
      new TrueImpactError(`Failed to build an instance of ${ctor.name}`),
    ]);
  }

  return result;
};

export function TrueImpactDataExample<TPersistenceDto>({
  example,
}: TrueImpactDataExampleOptions<TPersistenceDto>): ClassDecorator {
  return function (target: object) {
    const existingMetadata = (Reflect.get(
      target,
      TRUE_IMPACT_DATA_EXAMPLE_METADATA,
    ) as TrueImpactDataExampleMetadata) || {
      examples: new Map<string, TPersistenceDto>(),
    };

    existingMetadata.examples.set('default', example);

    // Is this necessary or does the above set mutate the value (does Reflect.get clone the metadata object?)
    Reflect.set(target, TRUE_IMPACT_DATA_EXAMPLE_METADATA, existingMetadata);
  };
}
