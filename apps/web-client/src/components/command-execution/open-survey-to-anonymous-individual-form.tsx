import { Tooltip } from "@mui/material";
import { JSX } from "react";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

export interface OpenSurveyToAnonymousIndividualFormProps {
  context: {
    // type: string;
    id: string;
  };
  onClose: () => void;
}

export const OpenSurveyToAnonymousIndividualForm = ({
  context,
  onClose,
}: OpenSurveyToAnonymousIndividualFormProps): JSX.Element => {
  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "OPEN_SURVEY_TO_ANONYMOUS_INDIVIDUAL",
    payload: {
      aggregateCompositeIdentifier: {
        type: "survey",
        id: context.id,
      },
    },
  };

  return (
    <Tooltip title="open this survey for anonymous completion">
      <button
        type="submit"
        onClick={() => {
          executeCommand(fsa);

          onClose();
        }}
      >
        Open for Anonymous Individual
      </button>
    </Tooltip>
  );
};
