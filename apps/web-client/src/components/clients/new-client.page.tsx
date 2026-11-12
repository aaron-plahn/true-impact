import { Stack } from "@mui/material";
import { useState } from "react";
import { DynamicClientCommunitySelector } from "./dynamic-client-community-selector";

export const NewClientPage = () => {
  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");

  return (
    <div data-testid="new-client-page">
      <form>
        <Stack>
          <label htmlFor="firstName-input">
            First Name
            <input
              id="firstName-input"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
              }}
            />
          </label>
          {/* TODO Middle Name */}
          <label htmlFor="lastName-input">
            Last Name
            <input
              id="lastName-input"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
              }}
            />
          </label>
          <label htmlFor="dateOfBirth-input">
            Date of Birth
            {/* TODO tool tips */}
            <input
              id="dateOfBirth-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
              }}
            />
          </label>
          <DynamicClientCommunitySelector />
          <button type="submit">Submit</button>
        </Stack>
      </form>
    </div>
  );
};
