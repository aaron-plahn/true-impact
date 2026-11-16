import { Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MultiTextInput } from "../common";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { DynamicClientCommunitySelector } from "./dynamic-client-community-selector";
import { useExecuteClientCommandMutation } from "./store";

export const NewClientPage = () => {
  const [firstName, setFirstName] = useState("");

  const [middleNames, setMiddleNames] = useState<string[]>([]);

  const [lastName, setLastName] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");

  const [isIndigenous, setIsIndigenous] = useState<"Yes" | "No" | "Unknown">(
    "Unknown",
  );

  const [communityId, setCommunityId] = useState<string | undefined>(undefined);

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteClientCommandMutation();

  const navigate = useNavigate();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  return (
    <div data-testid="new-client-page">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          executeCommand({
            type: "CREATE_CLIENT",
            payload: {
              firstName,
              middleNames,
              lastName,
              dateOfBirth,
              isIndigenous,
              communityId,
            },
          });

          /**
           * This is not quite right. What we want to do is to wait until the command
           * response comes back and then
           * - on error -> display the error and let the user correct the form
           * - on success -> navigate to the detail page for the new client
           */
          navigate("/clients");
        }}
      >
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
          <label>Middle Names</label>
          <MultiTextInput
            onChange={(newValue) => {
              setMiddleNames(newValue);
            }}
            name={"middleNames"}
            values={middleNames}
          />
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
          <label htmlFor="isIndigenous-input">
            Is Indigenous?
            <select
              id="isIndigenous-input"
              onChange={(e) => {
                setIsIndigenous(e.target.value as "Yes" | "No" | "Unknown");
              }}
            >
              <option key="indigenous-unknown" value="Unknown" selected>
                unknown
              </option>
              <option key="indigenous-yes" value="Yes">
                yes
              </option>
              <option key="indigenous-no" value="No">
                no
              </option>
            </select>
          </label>
          {isIndigenous === "Yes" ? (
            <DynamicClientCommunitySelector
              onChange={function (newValue: string | undefined): void {
                setCommunityId(newValue);
              }}
            />
          ) : null}
          <button type="submit">Submit</button>
        </Stack>
      </form>
    </div>
  );
};
