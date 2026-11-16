import { NonEmptyString } from 'src/libs/data-types';

// TODO is there a better place for this?
export class DynamicSelectorSearchBody {
  @NonEmptyString({
    label: 'search text',
    description:
      'text to search for across all searchable properties for this resource',
  })
  searchText: string;
}

export class LabelAndId {
  id: string;
  label: string;
}

export class DynamicSelectorResponse {
  results: LabelAndId[];
}
