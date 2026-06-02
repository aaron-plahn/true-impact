import { JSX, useState } from "react";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

interface AddQuestionCommandFormProps {
  context: {
    type: string;
    id: string;
  };
  onClose: () => void;
}

export const AddQuestionCommandForm = ({
  context,
  onClose,
}: AddQuestionCommandFormProps): JSX.Element => {
  const [questionLabel, setQuestionLabel] = useState("");

  const [prompt, setPrompt] = useState("");

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "ADD_QUESTION_TO_SURVEY",
    payload: {
      aggregateCompositeIdentifier: {
        type: context.type,
        id: context.id,
      },
      prompt,
      label: questionLabel,
    },
  };

  return (
    <form
      onSubmit={() => {
        executeCommand(fsa);

        onClose();
      }}
    >
      <label htmlFor="label-input">
        Label:
        <input
          id="label-input"
          type="text"
          value={questionLabel}
          onChange={(e) => {
            setQuestionLabel(e.target.value);
          }}
        />
      </label>
      <label htmlFor="prompt-input">
        <input
          id="prompt-input"
          type="text"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
      </label>
      <button type="submit">Add Question</button>
    </form>
  );
};
