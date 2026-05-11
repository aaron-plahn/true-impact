import { Button, Tooltip } from "@mui/material";
import { JSX, useState } from "react";

type Form = ({ onClose }: { onClose: () => void }) => JSX.Element;

interface CommandExecutorProps {
  type: string;
  label: string;
  description: string;
  // TODO Build this from the schema
  form: Form;
}

export const CommandExecutor = ({
  type: commandType,
  label,
  description,
  form: ProvidedForm,
}: CommandExecutorProps): JSX.Element => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      {!isFormOpen ? (
        <Tooltip title={description}>
          <Button
            id={`${commandType}_command-executor-button`}
            className="command-executor-button"
            onClick={() => {
              setIsFormOpen(true);
            }}
          >
            {label}
          </Button>
        </Tooltip>
      ) : (
        <ProvidedForm
          onClose={() => {
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
};
