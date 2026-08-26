import { Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { Link } from "react-router-dom";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSubmittedSurveysQuery } from "../store/survey-responses.api";

export const SurveyReviewIndexPage = (): JSX.Element => {
  const { data, isLoading, error } = useFetchSubmittedSurveysQuery();

  if (error) {
    // TODO RTK Query Fetch Error Presenter? It's time to do this now!
    return (
      <ApiResponseErrorInfo
        // @ts-expect-error Enough with React \ Redux TS madness!
        status={error?.status || 500}
        // @ts-expect-error Enough with React \ Redux TS madness!
        message={error?.data?.message || "unknown error"}
      />
    );
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <>
      <Typography variant="h1">Review a Survey!</Typography>
      <Stack>
        {data.map((completedResponse) => (
          <Typography variant="body1">
            <Link to={`/surveys/responses/${completedResponse.id}`}>
              {/* TODO timestamp presenter */}
              {completedResponse.name} [{completedResponse.submissionTime}]
            </Link>
          </Typography>
        ))}
      </Stack>
    </>
  );
};
