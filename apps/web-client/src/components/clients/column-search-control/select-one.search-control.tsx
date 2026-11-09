import { JSX } from "react/jsx-runtime";

interface TableSelectOneSearchControlProps {
  name: string;
  options: { label: string; value: string }[];
  onChange: (newValue: string) => void;
}

export const TableSelectOneSearchControl = ({
  name,
  options,
  onChange,
}: TableSelectOneSearchControlProps): JSX.Element => {
  return (
    <>
      {/* <label htmlFor={name}>{name}</label> */}
      <select
        name={name}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map(({ label, value }) => (
          <option value={value} key={`${name}-option-${label}`}>
            {label}
          </option>
        ))}
      </select>
      ;
    </>
  );
};
