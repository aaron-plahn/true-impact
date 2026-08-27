import { createSelector } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";

export interface ReportForSurveyResponse {
  name: string; // the report name, not the survey name
  categories: string[];
  valuesByCategory: Record<string, number>;
}

export interface SurveyResponseRecord {
  id: string;
  hasBeenCancelled: boolean;
  name: string; // ML text
  revision: string;
  size: number;
  reportsByName: Record<string, ReportForSurveyResponse>;
  submissionTime: number;
  hasBeenSubmitted: boolean;
}

export const surveyResponsesApi = createApi({
  reducerPath: "surveyResponses",
  // TODO double check this
  tagTypes: ["survey-response"],
  baseQuery: fetchBaseQuery({
    baseUrl: config.API_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    fetchSurveyResponseById: builder.query<SurveyResponseRecord, string>({
      query: (id: string) => `surveys/responses/${id}`,
      merge: (currentData, next) => {
        return {
          ...currentData,
          ...next,
        };
      },
      providesTags: (result, error, id) => {
        const tag = { type: "survey-response", id } as const;

        return [tag];
      },
    }),
    // TODO deal with pagination
    fetchSubmittedSurveys: builder.query<SurveyResponseRecord[], void>({
      query: () => "surveys/responses/submitted",
    }),
  }),
  /**
   * Note that we don't execute commands to survey responses. Survey completion
   * is facilitated by an isolated SDUI (non-React) client.
   */
});

export const {
  useFetchSubmittedSurveysQuery,
  useFetchSurveyResponseByIdQuery,
} = surveyResponsesApi;

export const makeSelectReportForSurveyResponseByResponseIdAndName = (
  surveyResponseRecordId: string,
  reportName: string,
) => {
  return createSelector(
    [
      surveyResponsesApi.endpoints.fetchSurveyResponseById.select(
        surveyResponseRecordId,
      ),
    ],
    (queryResult) => {
      const targetSurveyResponseRecord = queryResult?.data;

      if (!targetSurveyResponseRecord) {
        return undefined;
      }

      const report = targetSurveyResponseRecord.reportsByName[reportName];

      return report;
    },
  );
};
