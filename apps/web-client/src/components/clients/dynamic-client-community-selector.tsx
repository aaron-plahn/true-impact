import { Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { JSX } from "react/jsx-runtime";
import { config } from "../../config";
import { useDebounce } from "../../shared";

export const DynamicClientCommunitySelector = (): JSX.Element => {
  const [searchText, setSearchText] = useState<string>("");

  const [communityId, setCommunityId] = useState<string | undefined>(undefined);

  const [isListOpen, setIsListOpen] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 500);

  const [results, setResults] = useState<{ id: string; label: string }[]>([]);

  // const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`${config.API_URL}/communities/select`, {
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

        setIsListOpen(true);
      })
      .catch((_e) => {
        setError(
          new Error(`Failed to load community selection from the server.`),
        );
      });
  }, [debouncedSearchText]);

  if (error) {
    return (
      <div>
        Failed to load community selection menu from the server. Refresh the
        page to try again.
      </div>
    );
  }

  return (
    <div>
      <Stack>
        <label htmlFor="community-dynamic-select-input">
          <input
            id="community-dynamic-select-input"
            type="text"
            value={searchText}
            onChange={(e) => {
              // clear selection
              setCommunityId(undefined);

              setSearchText(e.target.value);
            }}
          />
        </label>
        <ul>
          <li
            key={"unknown-community"}
            onClick={() => {
              setCommunityId(undefined);

              setSearchText("");
            }}
          >
            Unknown
          </li>
          {!communityId
            ? (results || []).map((r) => (
                <li
                  key={r.id}
                  onClick={() => {
                    setCommunityId(r.id);

                    setSearchText(r.label);
                  }}
                >
                  {r.label}
                </li>
              ))
            : null}
        </ul>
      </Stack>
    </div>
  );
};
