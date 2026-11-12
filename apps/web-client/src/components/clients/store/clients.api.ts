import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";
import {
  AndQueryCondition,
  CommandFsa,
  CommandResponse,
  IndexTable,
  QueryOptions,
  SimpleQueryCondition,
} from "../../../shared";
import { ClientSearchSliceState } from "./client-search.slice";

// BEGIN copied from server
export interface ClientViewModel {
  id: string;
  dateOfBirth: string;
  revision: string;
  createdAt: number;
  fullName: {
    firstName: string;
    lastName: string;
    middleName: string[];
  };
  isIndigenous: "Yes" | "No" | "Unknown";
  community?: {
    id: string;
    bandNumber: string;
    revision: string;
    // languageCode -> translationType(role) -> text item
    name: {
      items: Record<string, Record<string, { text: string }>>;
    };
  };
}
// END copied from server

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

        const state = queryApi.getState() as {
          clientSearch: ClientSearchSliceState;
        };

        const {
          clientSearch: { searchTerms, pagination },
        } = state;

        const options: QueryOptions = {
          pagination,
        };

        const hasSearchTerms = JSON.stringify(searchTerms || {}) !== "{}";

        const isSearchAvailableForThisTable = tableLayout?.data?.isSearchable;

        if (hasSearchTerms && isSearchAvailableForThisTable) {
          const filter: AndQueryCondition = {
            type: "AND",
            conditions: [],
          };

          Object.entries(searchTerms).forEach(([key, value]) => {
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
    fetchClientById: builder.query<ClientViewModel, string>({
      query: (id: string) => `clients/${id}`,
      merge: (currentData, next) => {
        return {
          ...currentData,
          ...next,
        };
      },
      providesTags: (_result, _error, id) => {
        const tag = { type: "clients", id } as const;

        return [tag];
      },
    }),
    // TODO consider one mutation per command as an alternative pattern
    executeClientCommand: builder.mutation<
      CommandResponse,
      CommandFsa,
      unknown
    >({
      query: (commandFsa) => ({
        url: `clients/commands`,
        method: "POST",
        body: commandFsa,
        credentials: "include",
      }),
      invalidatesTags: (result) => {
        if (!result) {
          return [];
        }

        // Note that the cache key ('clients') is only coincidentally equal to the "aggregate type" \ "view type" from the server.
        const tag = { type: "clients", id: result.id } as const;

        return [tag];
      },
      // onQueryStarted?
    }),
  }),
});

export const {
  useFetchClientsQuery,
  useFetchClientByIdQuery,
  useExecuteClientCommandMutation,
} = clientsApi;
