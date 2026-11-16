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

  const { name, reportsByName, responses } = data;

  // TODO Join a view of the participant onto the response record if applicable

  return (
    <div data-testid={`survey-response-detail-page/${id}`}>
      <Typography variant="h2">{name}</Typography>
      <Typography variant="body2">(attempt ID: {id})</Typography>
      <Typography variant="h3">Responses</Typography>
      {responses.map((r) => {
        return (
          <div key={`surveyResponseRecord/${id}/questions/${r.questionLabel}`}>
            <Typography variant="body1">
              {r.questionLabel} {r.prompt}
            </Typography>
            {Object.entries(r.options).map(([label, o]) => {
              return (
                <Typography
                  variant="body2"
                  key={`survey-response/questions/${r.questionLabel}/options/${label}`}
                >
                  <em>{label}</em> {o.wasChosen ? "***" : ""} {o.text}
                </Typography>
              );
            })}
          </div>
        );
      })}
      <Typography variant="h3">Reports</Typography>
      {Object.entries(reportsByName).map(([reportName, _report]) => (
        <Link to={`/surveys/responses/${id}/reports/${reportName}`}>
          {reportName}
        </Link>
      ))}
    </div>
  );
};
