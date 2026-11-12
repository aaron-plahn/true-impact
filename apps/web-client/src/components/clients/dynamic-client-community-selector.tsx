import { Stack, Switch } from "@mui/material";
import { useEffect, useState } from "react";
import { JSX } from "react/jsx-runtime";
import { config } from "../../config";
import { useDebounce } from "../../shared";

export interface DynamicClientCommunitySelectorProps {
  onChange: (newValue: string | undefined) => void;
}

export const DynamicClientCommunitySelector = ({
  onChange,
}: DynamicClientCommunitySelectorProps): JSX.Element => {
  const [isCommunityKnown, setIsCommunityKnown] = useState(true);

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
        Client's Community
        <Switch
          checked={isCommunityKnown}
          onChange={() => {
            const isCommunityKnownNow = !isCommunityKnown;

            if (!isCommunityKnownNow) {
              onChange(undefined);
            }

            setIsCommunityKnown(isCommunityKnownNow);
          }}
        />
        {isCommunityKnown ? "I will choose below" : "I don't know"}
        {isCommunityKnown ? (
          <>
            <input
              id="community-dynamic-select-input"
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
          </>
        ) : null}
      </Stack>
    </div>
  );
};
