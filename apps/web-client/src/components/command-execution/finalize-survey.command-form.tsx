import { Tooltip } from "@mui/material";
import { JSX } from "react";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

interface FinalizeSurveyCommandFormProps {
  context: {
    type: string;
    id: string;
  };
  onClose: () => void;
}

export const FinalizeSurveyCommandForm = ({
  context: { type, id },
  onClose,
}: FinalizeSurveyCommandFormProps): JSX.Element => {
  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "FINALIZE_SURVEY",
    payload: {
      aggregateCompositeIdentifier: {
        type,
        id,
      },
    },
  };

  return (
    <Tooltip title="finalize this survey">
      <button
        type="submit"
        onClick={() => {
          executeCommand(fsa);

          onClose();
        }}
      >
        Finalize
      </button>
    </Tooltip>
  );
};
