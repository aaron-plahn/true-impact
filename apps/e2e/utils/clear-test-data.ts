import axios from "axios";

export const clearTestData = async (
  cookieHeader: string,
  testSetupEndpoints: string[],
) => {
  // const testSetupEndpoints: string[] = [
  //   "surveys/test-setup",
  //   "surveys/responses/test-setup",
  // ];

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

    const patchHeaders = {
      // "Content-Type": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: clientOrigin,
      ...(cookieHeader && { Cookie: cookieHeader }),
    };

    for (const testSetupEndpointForCollection of testSetupEndpoints) {
      const collectionClearResult = await axios.patch(
        `${baseApiUrl}/${testSetupEndpointForCollection}`,
        undefined,
        {
          withCredentials: true,
          headers: patchHeaders,
        },
      );

      expect(collectionClearResult.status).toBe(200);
    }
  } catch (error) {
    const exception = new Error(
      `Failed to clear test surveys in the database.\n${error}`,
    );

    console.error(exception.message);

    throw exception;
  }
};
