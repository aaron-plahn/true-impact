/**
 * COPIED FROM BACK-END
 * TODO (now) move this to a shared directory
 * TODO find an approach to syncronize these interfaces on change
 */
export type TableSearchFieldType = "TEXT" | "CHECKBOX" | "SELECT";

export type ColumnDataType =
  | "TEXT"
  | "DATE"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM"
  | "LINK";

export type LogicalOperator = "TEXT_INCLUDES" | "EQUALS";

type NavigationPanel = {
  currentPage: number;
  totalNumberOfPages: number;
  nextPage: number;
  previousPage: number;
  pageSize: number;
  availablePageSizes: number[];
  totalNumberOfResults: number;
};

export type CheckboxColumnSearchControl = {
  type: "CHECKBOX";
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
};

export type TextColumnSearchControl = {
  type: "TEXT";
  operator: LogicalOperator;
};

export type SelectColumnSearchControl = {
  type: "SELECT";
  operator: LogicalOperator;
  options: { label: string; value: string }[];
};

export type ColumnSearchControl =
  | TextColumnSearchControl
  | SelectColumnSearchControl;
// future scoped
// | CheckboxColumnSearchControl;

export interface IndexTableLayout {
  isSearchable: boolean;
  columns: {
    key: string;
    label: string;
    type: ColumnDataType;
    search?: ColumnSearchControl;
  }[];
}

export interface IndexTable<TRow = unknown> {
  title: string;
  layout: IndexTableLayout;
  rows: TRow[];
  navigationPanel: NavigationPanel;
}

export interface SimpleQueryCondition {
  type: "SIMPLE";
  field: string;
  operator: string;
  params: (string | number | boolean)[];
}

export interface AndQueryCondition {
  type: "AND";
  conditions: SimpleQueryCondition[];
}

export interface QueryOptions {
  pagination?: {
    page: number;
    pageSize: number;
  };
  filter?: AndQueryCondition;
}

/**
 * END Interfaces copied from server
 */
