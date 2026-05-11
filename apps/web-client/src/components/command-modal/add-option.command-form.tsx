import { Tooltip } from "@mui/material";
import { JSX, useState } from "react";
import { ErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

interface AddOptionToSurveyQuestionCommandFormProps {
  context: {
    type: string;
    id: string;
    questionLabel: string;
  };
  onClose: () => void;
}

export const AddOptionToSurveyQuestionCommandForm = ({
  context,
  onClose,
}: AddOptionToSurveyQuestionCommandFormProps): JSX.Element => {
  const [optionLabel, setOptionLabel] = useState("");
  const [text, setText] = useState("");

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
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
    type: "ADD_OPTION_TO_SURVEY_QUESTION",
    payload: {
      aggregateCompositeIdentifier: {
        type: context.type,
        id: context.id,
      },
      questionLabel: context.questionLabel,
      optionLabel,
      text,
    },
  };

  return (
    <form
      onSubmit={() => {
        executeCommand(fsa);

        // TODO Show the result and require acknowledgement first?
        onClose();
      }}
    >
      <label htmlFor="option-label-input">
        Option Label:
        <input
          id="optionLabel-input"
          type="text"
          value={optionLabel}
          onChange={(e) => {
            setOptionLabel(e.target.value);
          }}
        />
      </label>
      <label htmlFor="text-input">
        Text to Display for this Option:
        <input
          id="text-input"
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
      </label>
      <Tooltip title="add an option to this question">
        <button type="submit">Add Option</button>
      </Tooltip>
    </form>
  );
};
