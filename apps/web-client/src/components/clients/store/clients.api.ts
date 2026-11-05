import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";

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

type NavigationPanel = {
  currentPage: number;
  totalNumberOfPages: number;
  nextPage: number;
  previousPage: number;
  pageSize: number;
  availablePageSizes: number[];
  totalNumberOfResults: number;
};

interface IndexTable<TRow = unknown> {
  layout: {
    isSearchable: boolean;
    columns: {
      key: string;
      label: string;
      type: ColumnDataType;
    }[];
  };
  rows: TRow[];
  navigationPanel: NavigationPanel;
}

interface SimpleQueryCondition {
  type: "SIMPLE";
  field: string;
  operator: string;
  params: (string | number)[];
}

interface QueryOptions {
  pagination?: {
    page: number;
    pageSize: number;
  };
  filter?: {
    type: "AND";
    conditions: SimpleQueryCondition[];
  };
}

/**
 * END Interfaces copied from server
 */

export const clientsApi = createApi({
  reducerPath: "clients",
  tagTypes: ["clients"],
  baseQuery: fetchBaseQuery({
    baseUrl: config.API_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    fetchClients: builder.query<IndexTable, QueryOptions>({
      query: (options: QueryOptions) => ({
        url: "surveys/responses/submitted",
        method: "POST",
        body: options,
        credentials: "include",
      }),
    }),
    // fetchClientById: builder.query<unknown, string>({
    //   query: (id: string) => `surveys/responses/${id}`,
    //   providesTags: (_result, _error, id) => {
    //     const tag = { type: "clients", id } as const;

    //     return [tag];
    //   },
    //   //   merge
    // }),
  }),
});

export const { useFetchClientsQuery } = clientsApi;
