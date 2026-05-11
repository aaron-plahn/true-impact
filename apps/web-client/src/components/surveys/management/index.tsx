import { Button, Typography } from "@mui/material";
import { JSX } from "react";
import { Link } from "react-router-dom";

export const SurveyManagementIndex = (): JSX.Element => {
  return (
    <Button data-testid="new-survey-button">
      <Typography sx={{ textAlign: "center" }}>
        <Link to="/surveys/manage/new">New</Link>
      </Typography>
    </Button>
  );
};
