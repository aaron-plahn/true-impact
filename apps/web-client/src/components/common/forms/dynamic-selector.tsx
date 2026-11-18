import { useEffect, useState } from "react";
import { JSX } from "react/jsx-runtime";
import { config } from "../../../config";
import { useDebounce } from "../../../shared";
import { Loading } from "../../loading";

export interface DynamicSelectorProps {
  name: string;
  onChange: (newValue: string | undefined) => void;
  // the API endpoint for active search
  searchUrl: string;
}

export const DynamicSelector = ({
  name,
  searchUrl,
  onChange,
}: DynamicSelectorProps): JSX.Element => {
  const [searchText, setSearchText] = useState<string>("");

  const [communityId, setCommunityId] = useState<string | undefined>(undefined);

  const debouncedSearchText = useDebounce(searchText, 500);

  const [results, setResults] = useState<{ id: string; label: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`${config.API_URL}${searchUrl}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        searchText:
          debouncedSearchText === "" ? undefined : debouncedSearchText,
      }),
    })
      .then((result) => {
        return result.json();
      })
      .then((resultJSON) => {
        setResults(
          (resultJSON as { results: { id: string; label: string }[] }).results,
        );

        setIsLoading(false);
      })
      .catch((_e) => {
        setError(
          new Error(`Failed to load community selection from the server.`),
        );

        setIsLoading(false);
      });
  }, [debouncedSearchText, searchUrl]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div>
        Failed to load dynamic selection menu [{name}] from the server. Refresh
        the page to try again.
      </div>
    );
  }

  return (
    <div data-testid={`${name}-input`}>
      <input
        id={`dynamic-select-searchbar-${name}`}
        data-testid={`${name}-dynamic-select-searchbar`}
        type="text"
        value={searchText}
        onChange={(e) => {
          // clear selection
          setCommunityId(undefined);

          onChange(undefined);

          setSearchText(e.target.value);
        }}
      />
      <ul>
        {!communityId
          ? (results || []).map((r) => (
              <li
                key={r.id}
                onClick={() => {
                  setCommunityId(r.id);

                  onChange(r.id);

                  setSearchText(r.label);
                }}
              >
                {r.label}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
};
