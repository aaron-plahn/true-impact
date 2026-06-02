import { Button } from "@mui/material";
import { JSX } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store";
import { surveyApi } from "../store";

interface ClearAccessCodeButtonProps {
  attemptId: string;
  onClear?: () => void;
}

export const ClearAccessCodeButton = ({
  attemptId: surveyId,
  onClear,
}: ClearAccessCodeButtonProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();

  const handleClear = () => {
    dispatch(
      surveyApi.util.updateQueryData("fetchSurveyById", surveyId, (draft) => {
        if (draft && "accessCode" in draft) {
          delete draft.accessCode;
        }
      }),
    );

    if (typeof onClear === "function") {
      onClear();
    }
  };

  return <Button onClick={handleClear}>Clear</Button>;
};
