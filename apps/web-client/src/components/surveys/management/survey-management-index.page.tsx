import { Button, Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { Link } from "react-router-dom";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSurveysQuery } from "../store";

export const SurveyManagementIndex = (): JSX.Element => {
  const { data, isLoading, error } = useFetchSurveysQuery();

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <Stack>
      {data.map((survey) => (
        <Typography variant="body1" key={survey.id}>
          <Link to={`/surveys/manage/${survey.id}`}>{survey.name}</Link>
        </Typography>
      ))}
      <Typography sx={{ textAlign: "center" }}>
        <Button data-testid="new-survey-button">
          <Link to="/surveys/manage/new">New</Link>
        </Button>
      </Typography>
    </Stack>
  );
};
