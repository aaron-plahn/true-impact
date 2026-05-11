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
  onClose: () => void;
}

export const PublishSurveyCommandForm = ({
  context: { type, id },
  onClose,
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
    <Tooltip title="publish this survey">
      <button
        type="submit"
        onClick={() => {
          executeCommand(fsa);

          onClose();
        }}
      >
        Publish
      </button>
    </Tooltip>
  );
};
