import { Typography } from "@mui/material";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { JSX } from "react";

interface ErrorDisplayProps {
  error: FetchBaseQueryError | SerializedError;
}

const isFetchBaseQueryError = (
  input: unknown,
): input is FetchBaseQueryError => {
  const test = input as FetchBaseQueryError;

  return test.status !== null && typeof test.status !== "undefined";
};

export const ApiResponseErrorInfo = ({
  error,
}: ErrorDisplayProps): JSX.Element => {
  let status: string | number;
  let message: string;

  const defaultErrorMessage = "Unknown Error";

  if (isFetchBaseQueryError(error)) {
    status = error.status;
    // @ts-expect-error TODO update the type here
    message = error.data?.message || defaultErrorMessage;
  } else {
    status = error.code || 500;
    message = error.message || defaultErrorMessage;
  }

  return (
    <div className="error">
      <Typography variant="h2">{status}</Typography>
      <Typography variant="body1">{message}</Typography>
    </div>
  );
};
