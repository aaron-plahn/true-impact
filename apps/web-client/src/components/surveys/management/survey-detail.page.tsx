import { Button, Typography } from "@mui/material";
import { JSX, useState } from "react";
import { useParams } from "react-router-dom";
import { CommandModal } from "../../command-modal";
import { Loading } from "../../loading";
import { useFetchSurveyByIdQuery } from "../store/survey.api";

export const SurveyDetailPage = (): JSX.Element => {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const { name, questions } = data;

  return (
    <div>
      <Typography variant="h2">{name}</Typography>
      <div>
        {questions.map(({ label }) => (
          <div key={label}>
            <Typography variant="h3">{label}</Typography>
          </div>
        ))}
      </div>
      <Typography variant="h4">
        <Button
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          +
        </Button>
      </Typography>
      <CommandModal
        context={{
          aggregateCompositeIdentifier: {
            type: "survey",
            id: id || "",
          },
        }}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
