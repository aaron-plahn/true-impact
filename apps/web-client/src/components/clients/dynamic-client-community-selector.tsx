import { Stack, Switch } from "@mui/material";
import { useState } from "react";
import { JSX } from "react/jsx-runtime";
import { DynamicSelector } from "../common";

export interface DynamicClientCommunitySelectorProps {
  onChange: (newValue: string | undefined) => void;
}

export const DynamicClientCommunitySelector = ({
  onChange,
}: DynamicClientCommunitySelectorProps): JSX.Element => {
  const [isCommunityKnown, setIsCommunityKnown] = useState(true);

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
          <DynamicSelector
            onChange={onChange}
            searchUrl="/communities/select"
          />
        ) : null}
      </Stack>
    </div>
  );
};
