import { JSX, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { ApiResponseErrorInfo } from "../../error-handling";
import { Loading } from "../../loading";
import { useFetchSurveyByIdQuery } from "../store";
import { makeSelectReportForSurveyResponseByResponseIdAndName } from "../store/survey-responses.api";
import { DefaultSurveyReportPresenter } from "./default-survey-report.presenter";

export const SurveyResponseReportDetailPage = (): JSX.Element => {
  const { id: surveyResponseRecordId, reportName } = useParams();

  const { data, error, isLoading } = useFetchSurveyByIdQuery(
    surveyResponseRecordId || "",
  );

  const selectReport = useMemo(
    () =>
      makeSelectReportForSurveyResponseByResponseIdAndName(
        surveyResponseRecordId || "",
        reportName || "",
      ),
    [surveyResponseRecordId, reportName],
  );

  const report = useSelector(selectReport);

  if (isLoading || !data) {
    return <Loading />;
  }

  if (error) {
    return <ApiResponseErrorInfo error={error} />;
  }

  if (!report) {
    return <Loading />;
  }

  // TODO Support rich reports for specific reports by name (e.g., Medicine Wheel)
  return <DefaultSurveyReportPresenter report={report} />;
};
