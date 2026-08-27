import { Typography } from "@mui/material";
import { JSX } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSurveyResponseByIdQuery } from "../store/survey-responses.api";

export const SurveyResponseRecordDetailPage = (): JSX.Element => {
  const { id } = useParams();

  const { data, error, isLoading } = useFetchSurveyResponseByIdQuery(id || "");

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  const { name, reportsByName } = data;

  return (
    <div data-testid={`survey-response-detail-page/${id}`}>
      <Typography variant="h2">{name}</Typography>
      <Typography variant="h3">Reports</Typography>
      {Object.entries(reportsByName).map(([reportName, report]) => (
        <Link to={`/surveys/responses/${id}/reports/${reportName}`}>
          {reportName}
        </Link>
      ))}
    </div>
  );
};
