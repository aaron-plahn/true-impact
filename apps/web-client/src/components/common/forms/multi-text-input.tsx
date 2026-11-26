import { JSX } from "react/jsx-runtime";

const WORD_SEPARATOR = " ";

export interface MultiTextInputProps {
  name: string;
  label: string;
  onChange: (newValues: string[]) => void;
  values: string[];
}

export const MultiTextInput = ({
  name,
  label,
  onChange,
  values,
}: MultiTextInputProps): JSX.Element => {
  return (
    <label>
      {label}
      <input
        key={`${name}-multi-text-input`}
        data-testid={`${name}-input`}
        type="text"
        value={values.join(" ")}
        onChange={(e) => {
          const newValues = (e.target.value || "").split(WORD_SEPARATOR);

          onChange(newValues);
        }}
      ></input>
    </label>
  );
};
