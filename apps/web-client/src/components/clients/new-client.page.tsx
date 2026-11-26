import { Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatePicker, MultiTextInput, TextInputField } from "../common";
import { SelectOne } from "../common/forms/select-one";
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
        onSubmit={async (e) => {
          e.preventDefault();

          const result = await executeCommand({
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

          if (!result.error) {
            navigate(`/clients/${result.data.id}`);
          }
        }}
      >
        <Stack>
          <TextInputField
            name={"firstName"}
            label={"First Name"}
            isRequired={true}
            value={firstName}
            onChange={(newValue) => {
              setFirstName(newValue || "");
            }}
          />
          <MultiTextInput
            onChange={(newValue) => {
              setMiddleNames(newValue);
            }}
            label="Middle Names"
            name={"middleNames"}
            values={middleNames}
          />
          <TextInputField
            name="lastName"
            label="Last Name"
            isRequired={true}
            value={lastName}
            onChange={(newValue) => {
              setLastName(newValue || "");
            }}
          />
          <DatePicker
            name={"dateOfBirth"}
            label={"Date of Birth"}
            isRequired={true}
            value={dateOfBirth}
            onChange={(newValue) => {
              setDateOfBirth(newValue || "");
            }}
          />
          <SelectOne
            name={"isIndigenous"}
            label={"Is Indigenous?"}
            isRequired={true}
            value={isIndigenous}
            onChange={(newValue) => {
              setIsIndigenous(newValue as "Yes" | "No" | "Unknown");
            }}
            options={[
              {
                value: "Unknown",
                label: "unknown",
              },
              {
                value: "Yes",
                label: "yes",
              },
              {
                value: "No",
                label: "no",
              },
            ]}
          />
          {/* This part is tricky to do with dynamic forms. What we would need is the
            concept of a "dependent field". I.e., communityId is only to be specified
            if `isIndigenous === "Yes"`;
          */}
          {isIndigenous === "Yes" ? (
            <DynamicClientCommunitySelector
              onChange={function (newValue: string | undefined): void {
                setCommunityId(newValue);
              }}
            />
          ) : null}
          <button type="submit">Create Client</button>
        </Stack>
      </form>
    </div>
  );
};
