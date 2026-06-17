import { Entity, TrueImpactError } from '../../../libs/data-types';
import {
  GroupSessionLocation,
  GroupSessionLocationDto,
} from './group-session-location.value-object';

export class GroupSessionPersistenceDto {
  id: string;

  location: GroupSessionLocationDto;
}

export class GroupSession extends Entity {
  id: string;

  location: GroupSessionLocation;

  validateComplexInvariants(): TrueImpactError[] {
    const allErorrs: TrueImpactError[] = [];

    // TODO do this automatically based on the schema
    const locationValidationResult = this.location.validateInvariants();

    if (locationValidationResult instanceof Error) {
      allErorrs.push(locationValidationResult);
    }

    return allErorrs;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.id;
  }

  toPersistenceDto(): GroupSessionPersistenceDto {
    return {
      id: this.id,
      location: this.location.toPersistenceDto(),
    };
  }
}
