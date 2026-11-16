import { useState } from "react";
import { DynamicSelector } from "../../common";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useExecuteClientCommandMutation } from "../store";

interface AddCommunityAffiliationForClientCommandFormProps {
  context: {
    type: string;
    id: string;
  };
  onClose: () => void;
}

export const AddCommunityAffiliationForClientCommandForm = ({
  context,
  onClose,
}: AddCommunityAffiliationForClientCommandFormProps) => {
  const [communityId, setCommunityId] = useState<string | null>(null);

  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteClientCommandMutation();

  if (isRequestInProgress) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const fsa = {
    type: "ADD_COMMUNITY_AFFILIATION_FOR_CLIENT",
    payload: {
      aggregateCompositeIdentifier: {
        type: context.type,
        id: context.id,
      },
      communityId,
    },
  };

  return (
    <form
      onSubmit={() => {
        executeCommand(fsa);

        onClose();
      }}
    >
      Add Community
      <DynamicSelector
        onChange={(newValue) => {
          if (newValue) {
            setCommunityId(newValue);
          } else {
            setCommunityId(null);
          }
        }}
        searchUrl={"/communities/select"}
      />
      <button type="submit">Add Community</button>
    </form>
  );
};
