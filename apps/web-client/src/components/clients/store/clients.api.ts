import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";
import { ClientSearchSliceState } from "./client-search.slice";

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
  // TODO TS exposes a similar type. Should we stack our interfaces and use JS symbols instead of all-caps strings for these?
  // TODO allow-list these in validation
  operator: LogicalOperator;
  options: { label: string; value: string }[];
};

export type ColumnSearchControl =
  | TextColumnSearchControl
  | SelectColumnSearchControl
  | CheckboxColumnSearchControl;

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
  layout: IndexTableLayout;
  rows: TRow[];
  navigationPanel: NavigationPanel;
}

interface SimpleQueryCondition {
  type: "SIMPLE";
  field: string;
  operator: string;
  params: (string | number | boolean)[];
}

interface AndQueryCondition {
  type: "AND";
  conditions: SimpleQueryCondition[];
}

interface QueryOptions {
  pagination?: {
    page: number;
    pageSize: number;
  };
  filter?: AndQueryCondition;
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
    getOptions: builder.query<IndexTable["layout"], undefined>({
      query: () => ({
        url: "clients/index-table-options",
        method: "GET",
        credentials: "include",
      }),
    }),
    fetchClients: builder.query<IndexTable, QueryOptions>({
      // @ts-expect-error TODO fix types. RTK is horribly overengineered for our current needs. We might want to roll our own state management.
      queryFn: async (_, queryApi, _extraOptions, baseQuery) => {
        const tableLayout = await queryApi.dispatch(
          clientsApi.endpoints.getOptions.initiate(undefined),
        );

        console.log({
          ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ: tableLayout,
        });

        const state = queryApi.getState() as {
          clientSearch: ClientSearchSliceState;
        };

        console.log("2222222222222222222222222222");

        console.log({ stateZZZZZZZZZZZZZZZZZZZZZZZZZZZ: state });

        const {
          clientSearch: { searchTerms, pagination },
        } = state;

        const options: QueryOptions = {
          pagination,
        };

        console.log("33333333333333333333333333333333333");

        const hasSearchTerms = JSON.stringify(searchTerms || {}) !== "{}";

        console.log("4444444444444444444444444444444444444444444444");

        const isSearchAvailableForThisTable = tableLayout?.data?.isSearchable;

        console.log({ hasSearchTerms, isSearchAvailableForThisTable });

        if (hasSearchTerms && isSearchAvailableForThisTable) {
          const filter: AndQueryCondition = {
            type: "AND",
            conditions: [],
          };

          Object.entries(searchTerms).forEach(([key, value]) => {
            console.log("44444444444444444444444444444444");

            // linear search is not expensive because we only ever have ~10 columns in a table
            const targetCell = tableLayout.data?.columns.find(
              (column) => column.key === key,
            );

            const operator = targetCell?.search?.operator;

            if (operator) {
              const condition: SimpleQueryCondition = {
                type: "SIMPLE",
                field: key,
                operator,
                params: [value],
              };

              filter.conditions.push(condition);
            }
          });

          if (filter.conditions.length > 0) {
            Object.assign(options, {
              filter,
            });
          }

          console.log("555555555555555555555555555555555555555");
        }

        const result = await baseQuery({
          url: "clients",
          method: "POST",
          body: options,
          credentials: "include",
        });

        if (result.data) {
          return { data: result.data };
        }

        return {
          error: result?.error || JSON.stringify(result),
        };
      },
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
