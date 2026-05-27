import { Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { useParams } from "react-router-dom";
import {
  AddOptionToSurveyQuestionCommandForm,
  AddQuestionCommandForm,
  CommandExecutor,
  OpenSurveyToAnonymousIndividualForm,
  PublishSurveyCommandForm,
} from "../../command-execution";
import { Loading } from "../../loading";
import { useFetchSurveyByIdQuery } from "../store/survey.api";

export const SurveyDetailPage = (): JSX.Element => {
  const { id } = useParams();

  /**
   * TypeScript and React conflict here. TypeScript prefers for us to null-check
   * the ID, while react insists that we not call the following hook conditionally.
   */
  const { data, error, isLoading } = useFetchSurveyByIdQuery(id || "");

  if (isLoading || !data) {
    return <Loading />;
  }

  if (error) {
    // TODO `ErrorInfo` component
    return <div>Something went wrong.</div>;
  }

  const { name, questions, isPublished } = data;

  const isEditable = !isPublished;

  return (
    <div data-testid="survey-management-detail-page">
      <Typography variant="h2">{name}</Typography>

      <div>
        {questions.map(({ label: questionLabel, prompt, options }) => (
          <div key={questionLabel} data-testid={`questions/${questionLabel}`}>
            <Typography variant="h3">{questionLabel}</Typography>
            <br />
            <Typography variant="body1">{prompt}</Typography>
            {Object.values(options).map(({ label: optionLabel, text }) => (
              <div
                data-testid={`surveys.${id}.${questionLabel}.${optionLabel}`}
              >
                <Typography variant="body2">
                  {optionLabel}: {text}
                </Typography>
              </div>
            ))}
            {isEditable ? (
              <CommandExecutor
                type={"ADD_OPTION_TO_SURVEY_QUESTION"}
                key={`ADD_OPTION_TO_SURVEY_QUESTION_${questionLabel}`}
                customId={`ADD_OPTION_TO_SURVEY_QUESTION_${questionLabel}`}
                label={"Add Option"}
                description={"Add a new option for the target question"}
                form={({ onClose }) => (
                  <AddOptionToSurveyQuestionCommandForm
                    context={{
                      type: "survey",
                      id: id || "",
                      questionLabel,
                    }}
                    onClose={onClose}
                  />
                )}
              />
            ) : null}
            <br />
          </div>
        ))}
      </div>
      {isEditable ? (
        <CommandExecutor
          type={"ADD_QUESTION_TO_SURVEY"}
          label={"Add Question"}
          description={"Add a question to an existing survey."}
          form={({ onClose }) => (
            <AddQuestionCommandForm
              context={{
                type: "survey",
                id: id || "",
              }}
              onClose={onClose}
            />
          )}
        />
      ) : null}
      {isPublished ? (
        <Stack>
          <Typography variant="body1">** PUBLISHED FOR USE**</Typography>
          <CommandExecutor
            type={"OPEN_SURVEY_TO_ANONYMOUS_INDIVIDUAL"}
            label={"Open to Anonymous Participant"}
            description={"Generate a one-time access code for a participant"}
            form={({ onClose }) => (
              <OpenSurveyToAnonymousIndividualForm
                context={{
                  id: id || "",
                }}
                onClose={onClose}
              />
            )}
          />
        </Stack>
      ) : (
        <CommandExecutor
          type={"PUBLISH_SURVEY"}
          label={"Publish Survey"}
          description={"Finalize this Survey for use"}
          form={({ onClose }) => (
            <PublishSurveyCommandForm
              context={{
                type: "survey",
                id: id || "",
              }}
              onClose={onClose}
            />
          )}
        />
      )}
    </div>
  );
};
