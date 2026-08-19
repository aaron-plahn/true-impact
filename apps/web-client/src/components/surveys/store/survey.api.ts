import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";

interface Flag {
  id: string;
  label: string;
  description: string;
}

interface SurveyOption {
  label: string;
  text: string;
  // followUpQuestions
  flags: Record<string, Flag>;
}

export interface SurveyQuestion {
  label: string;
  prompt: string;
  options: Record<string, SurveyOption>;
}

interface CommandResponse {
  type: string;
  id: string;
  revision: string;
  accessCode?: string;
}

export interface SurveyDetailResponse {
  id: string;
  name: string;
  size: number;
  isFinal: boolean;
  isOpenToPublic: boolean;
  questions: SurveyQuestion[];
  accessCode?: string;
}

interface CommandFsa {
  type: string;
  payload: unknown;
}

export const surveyApi = createApi({
  reducerPath: "surveys",
  tagTypes: ["survey"],
  baseQuery: fetchBaseQuery({ baseUrl: config.API_URL }),
  endpoints: (builder) => ({
    fetchSurveyById: builder.query<SurveyDetailResponse, string>({
      query: (id: string) => `surveys/${id}`,
      merge: (currentData, next) => {
        return {
          ...currentData,
          ...next,
        };
      },
      providesTags: (result, error, id) => {
        const tag = { type: "survey", id } as const;

        return [tag];
      },
    }),
    fetchSurveys: builder.query<SurveyDetailResponse[], void>({
      // TODO inject user pagination and filter options
      query: () => `surveys`,
    }),
    /**
     * TODO We should use the [streaming updates API](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates) over ws: instead
     *
     */
    executeCommand: builder.mutation<CommandResponse, CommandFsa, unknown>({
      query: (commandFsa) => ({
        url: `surveys/commands`,
        method: "POST",
        body: commandFsa,
        credentials: "include",
      }),
      /**
       * Note that this triggers a full refresh of the survey. Although this mostly negates the benefits of using a SPA
       * instead of SSR, namely, fine-grained reactivity, it is the path of least resistance at this point. Ideally,
       * we will stream deltas over web-sockets in a write-hook on the query DB. But this will necessitate the use of selectors
       * throughout components or deep-tagging here. A better, but more time-consuming alternative is to dispense with React in favor
       * of a custom solution.
       */
      // @ts-expect-error I'm close to throwing out TS. React types are a hot mess of overengineered garbage.
      invalidatesTags: (result) => {
        if (!result) {
          return [];
        }

        const tag = { type: "survey", id: result.id };
        return [tag];
      },
      onQueryStarted: async (_commandFsa, { dispatch, queryFulfilled }) => {
        const { data: commandAcknowledgement } = await queryFulfilled;

        if (commandAcknowledgement.accessCode) {
          dispatch(
            surveyApi.util.updateQueryData(
              "fetchSurveyById",
              commandAcknowledgement.id,
              (draft) => {
                if (draft) {
                  Object.assign(draft, {
                    accessCode: commandAcknowledgement.accessCode,
                  });
                }
              },
            ),
          );
        }
      },
    }),
  }),
});

export const {
  useFetchSurveyByIdQuery,
  useFetchSurveysQuery,
  useExecuteCommandMutation,
} = surveyApi;
