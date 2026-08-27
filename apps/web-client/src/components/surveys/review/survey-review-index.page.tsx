import { Typography } from "@mui/material";
import { JSX } from "react";
import { Link } from "react-router-dom";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSubmittedSurveysQuery } from "../store/survey-responses.api";

export const SurveyReviewIndexPage = (): JSX.Element => {
  const { data, isLoading, error } = useFetchSubmittedSurveysQuery();

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
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
          {data.map((surveyResponseRecord) => (
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
