import { useSelector } from "react-redux";
import { RootState } from "../../../store";

interface KeywordTableSearchControlsProps {
  name: string;
  onChange: (newValue: string) => void;
  onFocus: (id: string) => void;
  isFocused: boolean;
}

export const KeywordTableSearchControl = ({
  name,
  onChange,
  onFocus,
  isFocused,
}: KeywordTableSearchControlsProps) => {
  const value = useSelector((state: RootState) => {
    return ((state?.clientSearch?.searchTerms || {})[name] || "") as string;
  });

  const id = `search-${name}`;

  return (
    <input
      ref={(node) => {
        if (node && isFocused) {
          node.focus();
        }
      }}
      id={id}
      type="text"
      placeholder={`search ${name}`}
      value={value}
      onFocus={() => {
        onFocus(id);
      }}
      onChange={(e) => {
        // Note that we check for falsey values at top level and dispatch `clearField` instead of `setField` in that case
        onChange(e?.target?.value);
      }}
    ></input>
  );
};
