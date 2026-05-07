import { Tooltip } from "@mui/material";
import { JSX } from "react";
import { ErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

interface PublishSurveyCommandFormProps {
  context: {
    type: string;
    id: string;
  };
}

export const PublishSurveyCommandForm = ({
  context: { type, id },
}: PublishSurveyCommandFormProps): JSX.Element => {
  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    console.log({ error });

    return (
      <ErrorInfo
        // @ts-expect-error Enough with React \ Redux TS madness!
        status={error?.status || 500}
        // @ts-expect-error Enough with React \ Redux TS madness!
        message={error?.data?.message || "unknown error"}
      />
    );
  }

  const fsa = {
    type: "PUBLISH_SURVEY",
    payload: {
      aggregateCompositeIdentifier: {
        type,
        id,
      },
    },
  };

  return (
    <form
      onSubmit={() => {
        executeCommand(fsa);
      }}
    >
      <Tooltip title="publish this survey">
        <button type="submit">Publish</button>
      </Tooltip>
    </form>
  );
};
