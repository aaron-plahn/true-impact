import { JSX, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Loading } from "../../loading";
import { useFetchSurveyByIdQuery } from "../store";
import { makeSelectReportForSurveyResponseByResponseIdAndName } from "../store/survey-responses.api";
import { DefaultSurveyReportPresenter } from "./default-survey-report.presenter";

export const SurveyResponseReportDetailPage = (): JSX.Element => {
  const { id: surveyResponseRecordId, reportName } = useParams();

  useFetchSurveyByIdQuery(surveyResponseRecordId || "");

  const selectReport = useMemo(
    () =>
      makeSelectReportForSurveyResponseByResponseIdAndName(
        surveyResponseRecordId || "",
        reportName || "",
      ),
    [surveyResponseRecordId, reportName],
  );

  // TODO what happened to the error state?
  const report = useSelector(selectReport);

  if (!report) {
    return <Loading />;
  }

  return <DefaultSurveyReportPresenter report={report} />;
};
