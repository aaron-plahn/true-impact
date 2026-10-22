export enum ConditionalBlockType {
  AND = 'AND',
  SIMPLE = 'SIMPLE', // base condition
}

export enum LogicalOperator {
  TEXT_INCLUDES = 'TEXT_INCLUDES',
  EQUALS = 'EQUALS',
}

export type QueryFilterParamType = string | number | QueryFilterParamType[];

export class SimpleQueryFilterCondition {
  readonly type = ConditionalBlockType.SIMPLE;

  field: string;

  operator: LogicalOperator;

  params: QueryFilterParamType[];
}

export class AndQueryFilterCondition {
  readonly type = ConditionalBlockType.AND;

  conditions: SimpleQueryFilterCondition[]; // we can change this to `QueryFilterCondition[]` at some point
}

export type QueryFilterCondition =
  SimpleQueryFilterCondition | AndQueryFilterCondition; // OR, NOT
