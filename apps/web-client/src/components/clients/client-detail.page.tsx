import { useParams } from "react-router-dom";
import { JSX } from "react/jsx-runtime";
import { CommandExecutor } from "../command-execution";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import { AddCommunityAffiliationForClientCommandForm } from "./command-execution";
import { useFetchClientByIdQuery } from "./store";

export const ClientDetailPage = (): JSX.Element => {
  const { id } = useParams();

  // TODO don't allow non-admin to access this endpoint or the corresponding index endpoint

  // we want to avoid hitting the index endpoint due to a missing ID. react doesn't want a conditional here so we can't short-circuit.
  const { data, error, isLoading } = useFetchClientByIdQuery(id || "*");

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  /**
   * TODO Ideally, we would move to a Server Driven UI approach by which our view model
   * is more like a true view (no domain knowledge). Instead of knowing about the logic, it should only know about
   * our design system, actions, and UX elements with text values.
   */
  const { fullName, isIndigenous, community, dateOfBirth } = data;

  const communityName = community
    ? community.name.items?.["en"]?.["original"]?.text
    : null;

  /**
   * If whether the client is Indigenous was previous marked as "Unknown",
   * adding a community also transitions `isIndigenous->"Yes"`.
   *
   * Only if `isIndigenous === "No"` do we want to hide this option.
   */
  const shouldEnableAddCommunity = !communityName && isIndigenous !== "No";

  return (
    <div>
      <h1>Client</h1>
      <h2>
        {fullName.firstName} {fullName.lastName}
      </h2>
      <p>DOB: {dateOfBirth}</p>
      {communityName ? <p>Community: {communityName}</p> : null}
      {shouldEnableAddCommunity ? (
        <CommandExecutor
          type={"ADD_COMMUNITY_AFFILIATION_FOR_CLIENT"}
          label={"Add Client's Community"}
          description={
            "Record the community with which the client is officially registered"
          }
          form={({ onClose }) => (
            <AddCommunityAffiliationForClientCommandForm
              onClose={onClose}
              context={{
                type: "client",
                id: id || "",
              }}
            />
          )}
        />
      ) : null}
      <p>Is Indigenous? {isIndigenous}</p>
    </div>
  );
};
