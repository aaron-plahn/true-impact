import { JSX } from "react/jsx-runtime";

const WORD_SEPARATOR = " ";

export interface MultiTextInputProps {
  name: string;
  onChange: (newValues: string[]) => void;
  values: string[];
}

export const MultiTextInput = ({
  name,
  onChange,
}: MultiTextInputProps): JSX.Element => {
  return (
    <input
      key={`${name}-multi-text-input`}
      data-testid={`${name}-input`}
      type="text"
      onChange={(e) => {
        const newValues = (e.target.value || "").split(WORD_SEPARATOR);

        onChange(newValues);
      }}
    ></input>
  );
};
