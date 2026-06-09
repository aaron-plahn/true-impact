import { USER_AGGREGATE_TYPE } from './constants';

export class UserCompositeIdentifier {
  type = USER_AGGREGATE_TYPE;

  id: string;
}
