import { useDispatch, useSelector } from "react-redux";
import { JSX } from "react/jsx-runtime";
import { useDebounce } from "../../shared";
import { RootState } from "../../store";
import { Loading } from "../loading";
import { TableColumnSearchControl } from "./column-search-control";
import { setClientSearchTermsForField, useFetchClientsQuery } from "./store";

const DEBOUNCE_DELAY_MS = 500;

const PLACEHOLDER_FOR_EMPTY_CELL = "-";

export const ClientIndexPage = (): JSX.Element => {
  const dispatch = useDispatch();

  const filterValues = useSelector(
    (state: RootState) => state.clientSearch.searchTerms,
  );

  const debouncedFilterValues = useDebounce(filterValues, DEBOUNCE_DELAY_MS);

  const {
    data: indexResponse,
    isFetching,
    error,
  } = useFetchClientsQuery(debouncedFilterValues, {
    // This is an alternative to polyfilling `isDeepStrictEqual`. Is there a better way to check for an empty object?
    // skip: JSON.stringify(debouncedFilterValues) === "{}",
  });

  if (isFetching || !indexResponse) {
    return <Loading />;
  }

  if (error) {
    // TODO use the correct presenter here
    return <div>{JSON.stringify(error)}</div>;
  }

  const { rows, layout } = indexResponse;

  /**
   * TODO
   * - Table Title (h2?)
   * - table headings
   * - table cells (using keys specified in headings)
   */
  return (
    <div data-testid="client-index-page">
      {/* TODO Typography */}
      <h2>Clients</h2>
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
                    onChange={(newValue) => {
                      console.log(`value changed for: ${key} to ${newValue}`);

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
              {layout.columns.map(({ key }) => {
                if (key in row) {
                  return <td key={`row-${key}-${rowIndex}`}>{row[key]}</td>;
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
