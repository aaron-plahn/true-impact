import { JSX } from "react/jsx-runtime";

interface TableSelectOneSearchControlProps {
  name: string;
  options: { label: string; value: string }[];
  onChange: (newValue: string) => void;
  onFocus: (id: string) => void;
  isFocused: boolean;
}

export const TableSelectOneSearchControl = ({
  name,
  options,
  onChange,
  isFocused,
}: TableSelectOneSearchControlProps): JSX.Element => {
  return (
    <>
      {/* <label htmlFor={name}>{name}</label> */}
      <select
        ref={(node) => {
          if (node && isFocused) {
            node.focus();
          }
        }}
        id={`search-${name}`}
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
