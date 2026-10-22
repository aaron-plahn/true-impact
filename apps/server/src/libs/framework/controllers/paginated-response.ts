export interface PaginatedResponse<TRow> {
  entities: TRow[];
  page: number;
  // pageSize = entities.length
  count: number;
}
