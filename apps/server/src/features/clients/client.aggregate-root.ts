import { NotImplementedException } from '@nestjs/common';
import { CreateClient } from './commands/create-client.command';
// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';

interface ValidateInvariants<T> {
  // Should we make this an either?
  validateInvariants(): T | Error;
}

export class ClientPeristenceDto {
  fullName: FullNameDto;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

  community?: string;
}

export class Client implements ValidateInvariants<Client> {
  fullName: FullName;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

  community?: string;

  constructor({
    fullName,
    dateOfBirth,
    isIndigenous,
    community,
  }: ClientPeristenceDto) {
    this.fullName = FullName.fromDto(fullName);

    this.dateOfBirth = dateOfBirth;

    this.isIndigenous = isIndigenous;

    this.community = community;
  }

  /**
   * TODO Use annotations \ class-validator style approach to validate schemas.
   */
  validateSchema(): Error[] {
    const allErrors = [];

    return allErrors;
  }

  validateInvariants(): Error | Client {
    const allErrors: Error[] = [];

    const schemaValidationErrors = this.validateSchema();

    allErrors.push(...schemaValidationErrors);

    if (allErrors.length > 0) {
      // TODO `InvariantValidationError`
      return new Error(
        `Invalid state for a "Client".\n${allErrors.map((e) => `${e}`).join('\n')}`,
      );
    }

    return this;
  }

  toPersistenceDto(): ClientPeristenceDto {
    return JSON.parse(JSON.stringify(this));
  }

  // TODO return `ResultOrError`
  public static fromClientCreated(): Client | Error {
    throw new NotImplementedException();
  }

  public static fromPersistenceDto(dto: ClientPeristenceDto): Client | Error {
    return new Client(dto).validateInvariants();
  }

  public static fromCreateClientCommand({
    aggregateComposteIdentifier: { id: clientId },
    firstName,
    lastName,
    dateOfBirth,
    isIndigenous,
    community,
  }: CreateClient) {
    return new Client({
      fullName: { firstName, lastName },
      dateOfBirth,
      isIndigenous,
      community,
    });
  }
}
