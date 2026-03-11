import { NonEmptyString } from '../../../libs/data-types';
import {
  CommunityCompositeIdentifier,
  CommunityCompositeIdentifierDataProperty,
} from '../models';

export class TranslateCommunityName {
  @CommunityCompositeIdentifierDataProperty
  aggregateCompositeIdentifier: CommunityCompositeIdentifier;

  @NonEmptyString({
    label: 'translation',
    description: 'translation of the community name',
  })
  translation: string;

  /**
   * TODO We need to validate that this is one of an allowed set of values.
   * We could introduce an `enum`, but we might want this to be configurable
   * via a tenant config file or in the DB.
   **/
  // @NonEmptyString({
  //   label: 'translation language',
  //   description: 'language in which you are translating the community name',
  // })
  // languageCode: string; // Enum?
  // assumed to be `clc` for now
}
