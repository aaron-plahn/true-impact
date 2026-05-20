import { Button, Tooltip } from "@mui/material";
import { JSX, useState } from "react";

type Form = ({ onClose }: { onClose: () => void }) => JSX.Element;

interface CommandExecutorProps {
  type: string;
  label: string;
  description: string;
  // TODO Build this from the schema
  form: Form;
  customId?: string;
}

export const CommandExecutor = ({
  type: commandType,
  label,
  description,
  form: ProvidedForm,
  customId,
}: CommandExecutorProps): JSX.Element => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const buttonId = customId || `${commandType}_command-executor-button`;

  return (
    <div>
      {!isFormOpen ? (
        <Tooltip title={description}>
          <Button
            id={buttonId}
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
