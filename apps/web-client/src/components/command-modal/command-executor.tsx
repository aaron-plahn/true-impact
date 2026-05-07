import { Button, Tooltip } from "@mui/material";
import React, { JSX, useState } from "react";

type Form = React.FunctionComponent;

interface CommandExecutorProps {
  type: string;
  label: string;
  description: string;
  // TODO Build this from the schema
  form: Form;
}

export const CommandExecutor = ({
  label,
  description,
  //   type,
  form: ProvidedForm,
}: CommandExecutorProps): JSX.Element => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div data-testid="command-executor">
      {!isFormOpen ? (
        <Tooltip title={description}>
          <Button
            id="command-executor-button"
            onClick={() => {
              setIsFormOpen(true);
            }}
          >
            {label}
          </Button>
        </Tooltip>
      ) : (
        <ProvidedForm />
      )}
    </div>
  );
};
