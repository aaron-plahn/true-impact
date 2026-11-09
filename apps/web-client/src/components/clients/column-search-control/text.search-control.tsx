import { useSelector } from "react-redux";
import { RootState } from "../../../store";

interface TableTextSearchControlProps {
  name: string;
  onChange: (newValue: string) => void;
  onFocus: (id: string) => void;
  isFocused: boolean;
}

export const TableTextSearchControl = ({
  name,
  onChange,
  onFocus,
  isFocused,
}: TableTextSearchControlProps) => {
  const value = useSelector((state: RootState) => {
    console.log({ state });

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
        // TODO how do we handle '' (empty search)?
        onChange(e?.target?.value);
      }}
    ></input>
  );
};
