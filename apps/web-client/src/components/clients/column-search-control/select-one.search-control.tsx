import { JSX } from "react/jsx-runtime";

interface TableSelectOneSearchControlProps {
  key: string;
  name: string;
  options: { label: string; value: string }[];
  onChange: (newValue: string) => void;
}

export const TableSelectOneSearchControl = ({
  name,
  key,
  options,
  onChange,
}: TableSelectOneSearchControlProps): JSX.Element => {
  return (
    <>
      {/* <label htmlFor={name}>{name}</label> */}
      <select
        name={name}
        id={key}
        key={key}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map(({ label, value }) => (
          <option value={value} key={`${key}-option-${label}`}>
            {label}
          </option>
        ))}
      </select>
      ;
    </>
  );
};
