import { isNonEmptyString } from './is-non-empty-string';

/**
 * [See the spec](https://www.rfc-editor.org/info/rfc1035/#section-2.3.4)
 */
const MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_TLD = 63;

const MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_DOMAIN_NAME = 255;

/**
 * We do not use a RegExp here to avoid opening up the possibility of ReDos.
 */
export const isEmailAddress = (input: unknown): input is string => {
  if (!isNonEmptyString(input)) {
    return false;
  }

  if (input.trim() !== input) {
    return false;
  }

  const splitOnSeparator = input.split('@');

  if (splitOnSeparator.length !== 2) {
    return false;
  }

  const [local, domain] = splitOnSeparator;

  if (!isNonEmptyString(local)) {
    return false;
  }

  if (!isNonEmptyString(domain)) {
    return false;
  }

  const indexOfLastDotInDomain = domain.lastIndexOf('.');

  // e.g. .mydomain, mydomain
  if (indexOfLastDotInDomain <= 0) {
    return false;
  }

  // e.g. subdomain.mydomain.
  if (indexOfLastDotInDomain === domain.length - 1) {
    return false;
  }

  if (domain.length > MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_DOMAIN_NAME) {
    return false;
  }

  const topLevelDomain = domain.substring(indexOfLastDotInDomain + 1);

  if (topLevelDomain.length < 2) {
    return false;
  }

  if (topLevelDomain.length > MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_TLD) {
    return false;
  }

  return true;
};
