import axios from "axios";

export const clearSurveys = async (cookieHeader?: string) => {
  try {
    // TODO use a config for this?
    const apiDomain = process.env.API_DOMAIN;

    if (!apiDomain) {
      throw new Error(`You need to set $API_DOMAIN in your test environment.`);
    }

    const apiServerPort = process.env.API_PORT;

    if (!apiServerPort) {
      throw new Error(`You need to set $API_PORT in your test environment.`);
    }

    const baseApiUrl = `${apiDomain}:${apiServerPort}`;

    await axios.post(`${baseApiUrl}/surveys/test-setup`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
  } catch (error) {
    const exception = new Error(
      `Failed to clear test surveys in the database.\n${error}`,
    );

    console.error(exception.message);

    throw exception;
  }
};
