import { SubmitEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../../config";
import { ApiResponseErrorInfo } from "../../error-handling";

export const NewSurveyPage = () => {
  const [error, setError] = useState<Error | null>(null);
  const [surveyName, setSurveyName] = useState<string>("");
  const navigate = useNavigate();

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  const onSubmit: SubmitEventHandler = async (event) => {
    event.preventDefault();

    const fsa = {
      type: "CREATE_SURVEY",
      payload: {
        name: surveyName,
      },
    };

    try {
      const response = await fetch(`${config.API_URL}/surveys/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(fsa),
      });

      const result = (await response.json()) as { id: string };

      navigate(`/surveys/manage/${result.id}`);
    } catch (error) {
      setError(error as Error);
    }
  };

  return (
    <div data-testid="new-survey-page">
      Build a new survey!
      <form onSubmit={onSubmit}>
        <label htmlFor="name-input">
          Name:
          <input
            id="name-input"
            type="text"
            value={surveyName}
            onChange={(e) => {
              setSurveyName(e.target.value);
            }}
          />
          <button type="submit">Submit</button>
        </label>
      </form>
    </div>
  );
};
