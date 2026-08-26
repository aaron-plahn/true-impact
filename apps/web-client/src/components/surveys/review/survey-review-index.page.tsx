import { Typography } from "@mui/material";
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
      <Typography variant="h1">Choose a Survey Response to Review</Typography>
      <table>
        <thead>
          <th>
            <td>Name</td>
          </th>
        </thead>
        <tbody>
          {(data || []).map((surveyResponseRecord) => (
            <tr>
              <td>
                <Link to={`/surveys/responses/${surveyResponseRecord.id}`}>
                  {surveyResponseRecord.name}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
