import { useState } from "react";
import { JSX } from "react/jsx-runtime";
import { DynamicSelector } from "../common";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

export interface OpenSurveyToClientFormProps {
  context: {
    // type: 'survey'
    id: string;
  };
  onClose: () => void;
}

export const OpenSurveyToClientForm = ({
  context,
  onClose,
}: OpenSurveyToClientFormProps): JSX.Element => {
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "OPEN_SURVEY_TO_CLIENT",
    payload: {
      aggregateCompositeIdentifier: {
        type: "survey",
        id: context.id,
      },
      clientId,
    },
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        executeCommand(fsa);

        onClose();
      }}
    >
      <DynamicSelector
        //   clients for surveys?
        name="clients"
        // TODO should we have the leading '/' here?
        searchUrl="/clients/select"
        onChange={(newValue) => {
          if (newValue) {
            setClientId(newValue);
          } else {
            setClientId(undefined);
          }
        }}
      />
      <button type="submit">Open to Client</button>
    </form>
  );
};
