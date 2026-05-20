import { Button, Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { Link } from "react-router-dom";
import { ErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSurveysQuery } from "../store";

export const SurveyManagementIndex = (): JSX.Element => {
  //   TODO remove `""` as an arg below
  const { data, isLoading, error } = useFetchSurveysQuery("");

  if (error) {
    return <ErrorInfo status={500} message={"A network request failed"} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <Stack>
      {data.map((survey) => (
        <Typography variant="body1">
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
