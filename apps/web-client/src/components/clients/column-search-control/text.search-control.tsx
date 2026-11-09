import { useSelector } from "react-redux";
import { RootState } from "../../../store";

interface TableTextSearchControlProps {
  name: string;
  onChange: (newValue: string) => void;
}

export const TableTextSearchControl = ({
  name,
  onChange,
}: TableTextSearchControlProps) => {
  const value = useSelector((state: RootState) => {
    console.log({ state });

    return ((state?.clientSearch?.searchTerms || {})[name] || "") as string;
  });

  return (
    <input
      type="text"
      placeholder={`search ${name}`}
      value={value}
      onChange={(e) => {
        // TODO how do we handle '' (empty search)?
        onChange(e?.target?.value);
      }}
    ></input>
  );
};
