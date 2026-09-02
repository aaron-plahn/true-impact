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

    const clientDomain = process.env.CLIENT_DOMAIN;

    const clientPort = process.env.CLIENT_PORT;

    if (!clientPort) {
      throw new Error(`You need to set $CLIENT_PORT in your test environment.`);
    }

    if (!clientDomain) {
      throw new Error(
        `You need to set $CLIENT_DOMAIN in your test environment.`,
      );
    }

    const clientOrigin = `${clientDomain}:${clientPort}`;

    const baseApiUrl = `${apiDomain}:${apiServerPort}`;

    const headers = {
      "Content-Type": "application/json",
      Origin: clientOrigin,
      ...(cookieHeader && { Cookie: cookieHeader }),
    };

    const surveyClearResult = await axios.patch(
      `${baseApiUrl}/surveys/test-setup`,
      undefined,
      {
        withCredentials: true,
        headers,
      },
    );

    expect(surveyClearResult.status).toBe(200);

    const responseClearResult = await axios.patch(
      `${baseApiUrl}/surveys/responses/test-setup`,
      undefined,
      {
        withCredentials: true,
        headers,
      },
    );

    expect(responseClearResult.status).toBe(200);
  } catch (error) {
    const exception = new Error(
      `Failed to clear test surveys in the database.\n${error}`,
    );

    console.error(exception.message);

    throw exception;
  }
};
