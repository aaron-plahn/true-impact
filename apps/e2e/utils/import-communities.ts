import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * TODO Can we organize all these helpers into a `community`
 * directory, i.e. into a "vertical slice"?
 *
 * I've been burned by reproducing the same "aggregate type" hierarchy in several places across a code base.
 * It makes it a lot of jumping around to add new features.
 */

export const importCommunities = async (
  relativePath: string,
  cookieHeader?: string,
  // should this be a `CommandAcknowledgement[]`
): Promise<string[]> => {
  const acks: string[] = [];

  // TODO share this logic with other aggregate types. The only difference is the command endpoint.
  try {
    const baseDir =
      path.resolve("features/support/fixtures/communities") + path.sep;

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
      /**
       * The commands endpoint uses strict schema-based type validation followed
       * by full state validation and finally escapes all user input. Further,
       * the DB being written to is an ephemeral e2e DB. There is no risk.
       */
      const response = await axios.post(
        `${baseApiUrl}/communities/commands`,
        fsa,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            ...(cookieHeader && { Cookie: cookieHeader }),
          },
        },
      );

      acks.push(response.data.id);
    }
  } catch (error) {
    const exception = new Error(
      `Failed to import test communities to the database. \n${error}`,
    );

    console.error(exception.message);

    throw exception;
  }

  return acks;
};
