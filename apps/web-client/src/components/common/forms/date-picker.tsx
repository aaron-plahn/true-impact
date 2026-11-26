import { JSX } from "react/jsx-runtime";

export interface DatePickerProps {
  name: string;
  label: string;
  // TODO We should use this. We should also specify the "placement".
  tooltip?: string;
  isRequired: boolean;
  value: string;
  onChange: (newValue: string | undefined) => void;
}

export const DatePicker = ({
  name,
  label,
  isRequired,
  value,
  onChange,
}: DatePickerProps): JSX.Element => {
  const id = `${name}-input`;

  return (
    <label htmlFor={id}>
      {label}
      <input
        type="date"
        id={id}
        data-testid={`${name}-input`}
        required={Boolean(isRequired)}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </label>
  );
};
