import { LogicalOperator } from 'src/libs/query-language';

// TODO
// export class TextCell {
//   type: 'TEXT';
//   data: string;
// }

// export class NumberCell {
//   type: 'NUMBER';
//   data: number;
// }

// export class LinkCell {
//   type: 'LINK';
//   to: string; // relative URL
//   label: string; // human facing
// }

export type TableSearchFieldType = 'TEXT' | 'CHECKBOX' | 'SELECT';

export type ColumnDataType = 'TEXT' | 'DATE' | 'NUMBER' | 'BOOLEAN' | 'ENUM';

type LabelAndValue = {
  label: string;
  value: unknown;
};

export class SelectColumnSearchControl {
  type: 'SELECT';
  // TODO TS exposes a similar type. Should we stack our interfaces and use JS symbols instead of all-caps strings for these?
  // TODO allow-list these in validation
  operator: LogicalOperator;
  options: LabelAndValue[];
}

export class CheckboxColumnSearchControl {
  type: 'CHECKBOX';
  operator: LogicalOperator;
  labelsAndValues: [
    {
      label: string;
      value: true;
    },
    {
      label: string;
      value: false;
    },
  ];
}

export class TextColumnSearchControl {
  type: 'TEXT';
  operator: LogicalOperator;
}

export type ColumnSearchControl =
  | TextColumnSearchControl
  | SelectColumnSearchControl
  | CheckboxColumnSearchControl;

class NavigationPanel {
  currentPage: number;
  totalNumberOfPages: number;
  nextPage: number;
  previousPage: number;
  pageSize: number;
  availablePageSizes: number[];
  totalNumberOfResults: number;
}

export class ColumnProperties<TKey> {
  key: TKey;
  label: string;
  type: ColumnDataType;
  // sortable?: boolean; // TODO suport sorting on the server as well
  /**
   * If present, the client should wire up a search bar under the heading cell.
   * `onChange` the state of this form field should be bound to
   */
  search?: ColumnSearchControl;
}

export class TableLayout<TKey> {
  isSearchable: boolean; // if `false`, there isn't a single column search cell to be rendered so the entire row can be omitted
  columns: ColumnProperties<TKey>[]; // ordered
}

export class IndexTable<T> {
  layout: TableLayout<keyof T>;
  rows: T[];
  navigationPanel: NavigationPanel;
}
