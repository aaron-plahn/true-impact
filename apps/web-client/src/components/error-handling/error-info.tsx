import { Typography } from "@mui/material";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { JSX } from "react";
import { Navigate } from "react-router-dom";

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

    if (Number.isInteger(status)) {
      const statusAsNumber = status as number;

      if (399 < statusAsNumber && statusAsNumber < 500) {
        /**
         * We treat not found and unauthorized errors the same
         * because our API returns not found for obscurity when the
         * user lacks permissions to perform a query.
         */
        return <Navigate to="/" />;
      }
    }
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
