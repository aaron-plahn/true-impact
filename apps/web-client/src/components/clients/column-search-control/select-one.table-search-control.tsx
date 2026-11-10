import { useSelector } from "react-redux";
import { JSX } from "react/jsx-runtime";
import { RootState } from "../../../store";

interface SelectOneTableSearchControlProps {
  name: string;
  options: { label: string; value: string }[];
  onChange: (newValue: string) => void;
  onFocus: (id: string) => void;
  isFocused: boolean;
}

const LABEL_WHEN_UNSELECTED = "Choose One";

export const SelectOneTableSearchControl = ({
  name,
  options,
  onChange,
  isFocused,
}: SelectOneTableSearchControlProps): JSX.Element => {
  const value = useSelector((state: RootState) => {
    return ((state?.clientSearch?.searchTerms || {})[name] || "") as string;
  });

  return (
    <>
      <select
        ref={(node) => {
          if (node && isFocused) {
            node.focus();
          }
        }}
        id={`search-${name}`}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        <option value="" selected>
          {LABEL_WHEN_UNSELECTED}
        </option>
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
