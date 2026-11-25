import { Link, useParams } from "react-router-dom";
import { JSX } from "react/jsx-runtime";
import { TISduiCommand } from "../../shared/command-action.interface";
import { CommandExecutor } from "../command-execution";
import { DynamicForm } from "../common";
import { ApiResponseErrorInfo } from "../error-handling";
import { Loading } from "../loading";
import {
  ClientViewModel,
  useExecuteClientCommandMutation,
  useFetchClientByIdQuery,
} from "./store";

const isCommandAction = (input: unknown): input is TISduiCommand => {
  return (input as TISduiCommand)?.type === "COMMAND";
};

const CommunityPresenter = ({
  community,
}: {
  community: ClientViewModel["community"] | TISduiCommand | null;
}): JSX.Element | null => {
  const [executeCommand, { isLoading: isRequestInProgress, error }] =
    useExecuteClientCommandMutation();

  if (!community) {
    return null;
  }

  if (isCommandAction(community)) {
    if (isRequestInProgress) {
      return <Loading />;
    }

    if (error) {
      return <ApiResponseErrorInfo error={error} />;
    }

    console.log({ communityForm: JSON.stringify(community) });

    return (
      <CommandExecutor
        form={({ onClose }) => (
          <DynamicForm
            label={community.label}
            fields={community.fields}
            context={community.context}
            onSubmit={(payload) => {
              executeCommand({
                type: community.commandType,
                payload,
              });
            }}
          />
        )}
        type={community.type}
        label={community.label}
        // TODO should we rename this on the executor?
        description={community.tooltip}
      />
    );
    // return (
    //   <CommandExecutor
    //     type={"ADD_COMMUNITY_AFFILIATION_FOR_CLIENT"}
    //     label={"Add Client's Community"}
    //     description={
    //       "Record the community with which the client is officially registered"
    //     }
    //     form={({ onClose }) => (
    //       <AddCommunityAffiliationForClientCommandForm
    //         onClose={onClose}
    //         context={{
    //           type: "client",
    //           id: community.context.aggregateCompositeIdentifier.id || "",
    //         }}
    //       />
    //     )}
    //   />
    // );
  }

  // TODO move this logic to the server
  const communityName = community.name.items?.["en"]?.["original"]?.text;

  if (communityName) {
    return (
      <p data-testid="client-details-community">Community: {communityName}</p>
    );
  }

  // This is a system error and should never happen
  return <div>Missing text for the property: community name</div>;
};

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
  const { fullName, isIndigenous, community, dateOfBirth, surveyResponses } =
    data;

  const middleInitials = (fullName.middleName || []).join(".");

  return (
    <div>
      <h1>Client</h1>
      <h2 data-testid="client-details-name">
        {fullName.firstName} {middleInitials} {fullName.lastName}
      </h2>
      <p data-testid="client-details-dob">DOB: {dateOfBirth}</p>
      <CommunityPresenter community={community} />

      <p data-testid="client-details-isIndigenous">
        Is Indigenous? {isIndigenous}
      </p>
      {surveyResponses.length > 0 ? (
        <div data-testid={`client/survey-response-list`}>
          <h3>Survey Responses</h3>
          <ul>
            {surveyResponses.map((sr) => {
              const key = `client/${id}/survey-responses/${sr.id}`;

              if (!sr.hasBeenSubmitted) {
                return <li key={key}>{sr.name} (in progress)</li>;
              }

              // TODO even though we know this should exist, let's be more defensive here
              const submissionDate = new Date(
                parseInt(sr.submissionTime as string),
              );

              return (
                <li key={key}>
                  <Link to={`/surveys/responses/${sr.id}`}>
                    {sr.name} ({submissionDate.toDateString()} @{" "}
                    {submissionDate.toTimeString()})
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
