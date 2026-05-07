import { Typography } from "@mui/material";
import { JSX } from "react";

interface ErrorDisplayProps {
  status: number;
  message: string;
}

export const ErrorInfo = ({
  status,
  message,
}: ErrorDisplayProps): JSX.Element => {
  return (
    <div className="error">
      <Typography variant="h2">{status}</Typography>
      <Typography variant="body1">{message}</Typography>
    </div>
  );
};
