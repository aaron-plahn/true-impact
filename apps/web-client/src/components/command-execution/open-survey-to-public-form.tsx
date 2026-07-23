import { Tooltip } from "@mui/material";
import { JSX } from "react";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

export interface OpenSurveyToPublicFormProps {
  context: {
    // type: string;
    id: string;
  };
  onClose: () => void;
}

export const OpenSurveyToPublicForm = ({
  context,
  onClose,
}: OpenSurveyToPublicFormProps): JSX.Element => {
  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "OPEN_SURVEY_TO_PUBLIC",
    payload: {
      aggregateCompositeIdentifier: {
        type: "survey",
        id: context.id,
      },
    },
  };

  return (
    <Tooltip title="open survey for public completion">
      <button
        type="submit"
        onClick={() => {
          executeCommand(fsa);

          onClose();
        }}
      >
        Open to Public
      </button>
    </Tooltip>
  );
};
