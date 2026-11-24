import { JSX } from "react/jsx-runtime";

interface SelectOneOptionProps {
  label: string;
  value: string;
}

export interface SelectOneProps {
  name: string;
  label: string;
  // TODO use this
  tooltip?: string;
  isRequired: boolean;
  value: string;
  onChange: (newValue: string) => void;
  options: SelectOneOptionProps[];
}

export const SelectOne = ({
  name,
  label,
  onChange,
  isRequired,
  options,
  value,
}: SelectOneProps): JSX.Element => {
  const id = `${name}-input`;

  return (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        required={Boolean(isRequired)}
        data-testid={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map((o, index) => (
          // the first option is selected by default
          <option
            selected={index === 0}
            key={`${name}-${o.value}`}
            value={o.value}
          >
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};
