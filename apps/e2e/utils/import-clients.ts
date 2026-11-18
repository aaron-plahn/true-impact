import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";

const injectContext = <T>(payload: T, acks: { id: string }[]): T => {
  const payloadToUse = {};

  if (Array.isArray(payload)) {
    // @ts-expect-error
    return payload.map((item) => injectContext(item, acks));
  }

  if (typeof payload === "string") {
    if (payload.startsWith("$acks[")) {
      try {
        const index = parseInt(payload.split("$acks[")[1]);

        if (!(index in acks)) {
          throw new Error(
            `Index error: index [${index}] is out of range for the available command execution context. Not this many commands have been executed.`,
          );
        }

        const { id } = acks[index];

        // @ts-expect-error
        return id;
      } catch (error) {
        throw error;
      }
    } else {
      // we want to keep the original text value
      return payload;
    }
  }

  if (typeof payload === "object") {
    // @ts-expect-error
    Object.entries(payload).forEach(([propertyKey, rawValue]) => {
      // @ts-expect-error
      payloadToUse[propertyKey] = injectContext(rawValue, acks);
    });

    // @ts-expect-error
    return payloadToUse;
  }

  // sidestep contravariance error
  return payloadToUse as unknown as T;
};

export const importClients = async (
  relativePath: string,
  cookieHeader?: string,
) => {
  const acks: { id: string }[] = [];

  try {
    const baseDir = path.resolve("features/clients/fixtures") + path.sep;

    if (relativePath.includes(path.sep)) {
      throw new Error(
        `Unauthorized path traversal detected in path ${relativePath}`,
      );
    }

    // nosemgrep
    const pathWithBaseDir = path.resolve(baseDir, relativePath);

    if (!pathWithBaseDir.startsWith(baseDir)) {
      throw new Error(
        `Unauthorized path traversal detected in path ${relativePath}`,
      );
    }

    // We input the file from a spec. It doesn't come from a user. This runs in an ephemeral environment. There is no risk here.
    const rawData = await fs.readFile(pathWithBaseDir, "utf-8");

    const fixtureData = JSON.parse(rawData);

    const apiDomain = process.env.API_DOMAIN;

    if (!apiDomain) {
      throw new Error(`You need to set $API_DOMAIN in your test environment.`);
    }

    const apiServerPort = process.env.API_PORT;

    if (!apiServerPort) {
      throw new Error(`You need to set $API_PORT in your test environment.`);
    }

    const baseApiUrl = `${apiDomain}:${apiServerPort}`;

    if (!Array.isArray(fixtureData)) {
      throw new Error(
        `Expected an array of command FSAs when reading the fixture data at: ${pathWithBaseDir}`,
      );
    }

    for (const fsa of fixtureData) {
      let endpoint = "/clients/commands";

      if (
        // there is no aggregateCompositeIdentifier on a create command
        fsa.type === "CREATE_COMMUNITY" ||
        fsa.payload.aggregateCompositeIdentifier?.type === "community"
      ) {
        endpoint = "/communities/commands";
      }

      const payloadToUse = injectContext(fsa.payload, acks);

      /**
       * The commands endpoint uses strict schema-based type validation followed
       * by full state validation and finally escapes all user input. Further,
       * the DB being written to is an ephemeral e2e DB. There is no risk.
       */
      const response = await axios
        .post(
          `${baseApiUrl}${endpoint}`,
          { type: fsa.type, payload: payloadToUse },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              ...(cookieHeader && { Cookie: cookieHeader }),
            },
          },
        )
        .catch((result) => {
          return {
            isError: true,
            message: result?.response?.data?.message || "unknown network error",
            payloadToUse,
          };
        });

      if ("isError" in response) {
        throw new Error(response.message);
      }

      acks.push(response.data);
    }
  } catch (error) {
    const exception = new Error(
      `Failed to import test clients to the database. \n${(error as { message: string })?.message}`,
    );

    console.error(exception.message);

    throw exception;
  }

  return acks;
};
