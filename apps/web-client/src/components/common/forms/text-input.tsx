interface TextInputFieldProps {
  name: string;
  label: string;
  // TODO use this
  tooltip?: string;
  isRequired: boolean;
  value: string;
  onChange: (newValue: string | undefined) => void;
}

export const TextInputField = ({
  name,
  label,
  isRequired,
  value,
  onChange,
}: TextInputFieldProps) => {
  const id = `${name}-input`;

  return (
    <label htmlFor={id}>
      {label}
      <input
        type="text"
        id={id}
        data-testid={`${name}-input`}
        required={Boolean(isRequired)}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      ></input>
    </label>
  );
};
