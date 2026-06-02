import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Paper, Tooltip, Typography } from "@mui/material";
import { JSX } from "react";
import { ClearAccessCodeButton } from "./clear-access-button";

interface AccessCodeClipboardProps {
  attemptId: string;
  accessCode: string;
}

export const AccessCodeClipboard = ({
  attemptId,
  accessCode,
}: AccessCodeClipboardProps): JSX.Element => {
  const copyCodeToKeyboard = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
    } catch (err) {
      console.error(`Failed to copy text to the clipboard:\n ${err}`);
    }
  };

  return (
    <Paper sx={{ height: "96px" }}>
      <Box>
        <Typography variant="h3">Copy Access Code</Typography>
        <Typography variant="body1">
          Please copy this access code as you will not be able to access it once
          the page is refreshed.
        </Typography>
        <Typography variant="body1">{accessCode}</Typography>
        <Tooltip title="Copy to Clipboard">
          <Button id="copyAccessCode" onClick={copyCodeToKeyboard}>
            <ContentCopyIcon sx={{ height: "24px" }} />
          </Button>
        </Tooltip>

        <Typography variant="body1">
          Share this link with the participant:
        </Typography>
        {/* TODO We need to host the SPA on the same server as the back-end or else store the back-end URL in the config and deal with CORS */}
        <a
          id="surveyResponseLink"
          href={`http://localhost:3234/surveys/responses/begin/${attemptId}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Survey Link
        </a>
        <ClearAccessCodeButton attemptId={attemptId}></ClearAccessCodeButton>
      </Box>
    </Paper>
  );
};
