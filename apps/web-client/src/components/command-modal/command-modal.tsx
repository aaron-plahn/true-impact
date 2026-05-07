import { JSX, SubmitEventHandler, useEffect, useRef, useState } from "react";
import { Loading } from "../loading";
import { useExecuteCommandMutation } from "../surveys/store";

interface CommandContext {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

interface CommandModalProps {
  context: CommandContext;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandModal = ({
  context,
  isOpen,
  onClose,
}: CommandModalProps): JSX.Element => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [questionLabel, setQuestionLabel] = useState("");

  const [prompt, setPrompt] = useState("");

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteCommandMutation();

  // const [error, setError] = useState<Error | null>(null);

  // const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (error) {
    return <div>Something went wrong!</div>;
  }

  if (isRequestInProgress) {
    return <Loading />;
  }

  // if (successMessage) {
  //   return (
  //     <div data-testid="command-modal-success-acknowledgement-area">
  //       <Typography variant="body1">{successMessage}</Typography>
  //       <Button
  //         onClick={() => {
  //           onClose();

  //           console.log("I should close..............");
  //         }}
  //       >
  //         OK
  //       </Button>
  //     </div>
  //   );
  // }

  const onSubmit: SubmitEventHandler = async (event) => {
    event.preventDefault();

    const fsa = {
      type: "ADD_QUESTION_TO_SURVEY",
      payload: {
        ...context,
        label: questionLabel,
        prompt,
      },
    };

    executeCommand(fsa);

    // try {
    //   setIsRequestInProgress(true);

    //   fetch("http://localhost:3234/surveys/commands", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(fsa),
    //   })
    //     .then((response) => {
    //       return response.json();
    //     })
    //     .then((result: { id: string; revision: string }) => {
    //       setSuccessMessage(
    //         `Updated ${context.aggregateCompositeIdentifier.type}/${context.aggregateCompositeIdentifier.id} (revision: ${result.revision})`,
    //       );
    //       setIsRequestInProgress(false);
    //     });
    // } catch (error) {
    //   setError(error as Error);
    // }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose} id="command-form-modal">
      <form onSubmit={onSubmit}>
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
    </dialog>
  );
};
