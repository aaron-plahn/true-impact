import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { JSX } from "react/jsx-runtime";
import { useDebounce } from "../../shared";
import { RootState } from "../../store";
import { Loading } from "../loading";
import { TableColumnSearchControl } from "./column-search-control";
import {
  clearClientSearchField,
  setClientSearchTermsForField,
  useFetchClientsQuery,
} from "./store";

const DEBOUNCE_DELAY_MS = 500;

const PLACEHOLDER_FOR_EMPTY_CELL = "-";

export const ClientIndexPage = (): JSX.Element => {
  const dispatch = useDispatch();

  const [focusedField, setFocusedField] = useState<null | string>(null);

  const filterValues = useSelector(
    (state: RootState) => state.clientSearch.searchTerms,
  );

  const debouncedFilterValues = useDebounce(filterValues, DEBOUNCE_DELAY_MS);

  const {
    data: indexResponse,
    isFetching,
    error,
  } = useFetchClientsQuery(debouncedFilterValues, {});

  if (isFetching || !indexResponse) {
    return <Loading />;
  }

  if (error) {
    // TODO use the correct presenter here
    return <div>{JSON.stringify(error)}</div>;
  }

  const { rows, layout, title } = indexResponse;

  return (
    <div data-testid="client-index-page">
      {/* TODO Typography */}
      <h2>{title}</h2>
      <table>
        <tr>
          {layout.columns.map(({ label, key }) => (
            <th key={key}>{label}</th>
          ))}
        </tr>
        {layout.isSearchable ? (
          <tr>
            {layout.columns.map(({ search, key }) =>
              search ? (
                <td>
                  <TableColumnSearchControl
                    {...search}
                    name={key}
                    value={filterValues[key] || ""}
                    onFocus={(id: string) => {
                      setFocusedField(id);
                    }}
                    isFocused={focusedField === `search-${key}`}
                    onChange={(
                      newValue: string | number | boolean | null | undefined,
                    ) => {
                      console.log(`value changed for: ${key} to ${newValue}`);

                      if (
                        newValue === null ||
                        newValue === "" ||
                        typeof newValue === "undefined"
                      ) {
                        dispatch(
                          clearClientSearchField({
                            field: key,
                          }),
                        );

                        return;
                      }

                      dispatch(
                        setClientSearchTermsForField({
                          field: key,
                          value: newValue,
                        }),
                      );
                    }}
                  />
                </td>
              ) : (
                <td>
                  <div>{PLACEHOLDER_FOR_EMPTY_CELL}</div>
                </td>
              ),
            )}
          </tr>
        ) : null}
        {rows.map((r, rowIndex) => {
          // TODO tighten the type up in the shared interface
          const row = r as Record<string, string>;
          return (
            <tr>
              {layout.columns.map(({ type, key }) => {
                if (key in row) {
                  const rawValue = row[key];

                  const renderedCell =
                    type === "LINK" ? (
                      <Link to={rawValue}>Link</Link>
                    ) : (
                      rawValue
                    );

                  return <td key={`row-${key}-${rowIndex}`}>{renderedCell}</td>;
                }

                /**
                 * TODO it might be better to emit an error state if s
                 */
                return (
                  <td key={`row-${key}-${rowIndex}`}>
                    {PLACEHOLDER_FOR_EMPTY_CELL}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </table>
    </div>
  );
};
