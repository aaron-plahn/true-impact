import { JSX } from "react/jsx-runtime";
import { ColumnSearchControl } from "../store";
import { TableSelectOneSearchControl } from "./select-one.search-control";
import { TableTextSearchControl } from "./text.search-control";

export const TableColumnSearchControl = (
  props: ColumnSearchControl & {
    onChange: (newValue: string | number) => void;
    onFocus: (id: string) => void;
    isFocused: boolean;
    name: string;
    value: string | number | boolean;
  },
): JSX.Element => {
  const { type, name } = props;

  if (type === "TEXT") {
    return (
      <TableTextSearchControl
        name={name}
        onChange={props.onChange}
        onFocus={props.onFocus}
        isFocused={props.isFocused}
      />
    );
  }

  if (type === "CHECKBOX") {
    return <div>TODO Checkbox search</div>;
  }

  if (type === "SELECT") {
    const { options } = props;

    return (
      <TableSelectOneSearchControl
        data-testid={`search-${name}`}
        name={name}
        options={options}
        onChange={props.onChange}
        onFocus={props.onFocus}
        isFocused={props.isFocused}
      />
    );
  }

  const exhaustiveCheck: never = type;

  console.warn(
    `Detected unknown column search configuration. Unsupported search cell type: ${exhaustiveCheck as string}`,
  );

  //   This is a system error. Maybe we should render the `type` in a click-disabled cell.
  return <div>-</div>;
};
