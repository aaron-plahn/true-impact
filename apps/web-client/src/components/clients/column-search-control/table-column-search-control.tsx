import { JSX } from "react/jsx-runtime";
import { ColumnSearchControl } from "../store";
import { TableSelectOneSearchControl } from "./select-one.search-control";

export const TableColumnSearchControl = (
  props: ColumnSearchControl & {
    onChange: (newValue: string | number) => void;
    name: string;
  },
): JSX.Element => {
  const { type, name } = props;

  if (type === "TEXT") {
    return <div>TODO Checkbox search</div>;
  }

  if (type === "CHECKBOX") {
    return <div>TODO Checkbox search</div>;
  }

  if (type === "SELECT") {
    const { options } = props;

    return (
      <TableSelectOneSearchControl
        key={`search-${name}`}
        data-testid={`search-${name}`}
        name={name}
        options={options}
        onChange={props.onChange}
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
