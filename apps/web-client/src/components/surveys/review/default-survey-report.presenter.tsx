import { Typography } from "@mui/material";
import { JSX } from "react";
import { ReportForSurveyResponse } from "../store/survey-responses.api";

export interface DefaultSurveyReportPresenterProps {
  report: ReportForSurveyResponse;
}

export const DefaultSurveyReportPresenter = ({
  report,
}: DefaultSurveyReportPresenterProps): JSX.Element => {
  const rows = Object.entries(report.valuesByCategory).map(
    ([category, value]) => ({ category, value }),
  );

  return (
    <div>
      <Typography variant="h3">{report.name}</Typography>
      <table>
        <tr>
          <th>Category</th>
          <th>Value</th>
        </tr>
        {rows.map((row) => (
          <tr key={row.category}>
            <td>{row.category}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};
