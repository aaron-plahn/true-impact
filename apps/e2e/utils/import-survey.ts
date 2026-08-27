import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";

export const importSurvey = async (
  relativePath: string,
  cookieHeader?: string,
): Promise<void> => {
  try {
    const baseDir =
      path.resolve("features/support/fixtures/surveys") + path.sep;

    if (relativePath.includes(path.sep)) {
      throw new Error(
        `Unauthorized path traversal detected in path ${relativePath}`,
      );
    }

    const pathWithBaseDir = path.resolve(baseDir, relativePath);

    if (!pathWithBaseDir.startsWith(baseDir)) {
      throw new Error(
        `Unauthorized path traversal detected in path ${relativePath}`,
      );
    }

    // We input the file from a spec. It doesn't come from a user. This runs in an ephemeral environment. There is no risk here.
    // nosemgrep
    const rawData = await fs.readFile(pathWithBaseDir, "utf-8");

    const fixtureData = JSON.parse(rawData);

    const adminUser = process.env.SYSTEM_ADMIN_USERNAME;

    if (!adminUser) {
      throw new Error(
        `You need to set $SYSTEM_ADMIN_USERNAME in your test environment.`,
      );
    }

    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        `You need to set $INITIAL_ADMIN_PASSWORD in your test environment.`,
      );
    }

    const apiDomain = process.env.API_DOMAIN;

    if (!apiDomain) {
      throw new Error(`You need to set $API_DOMAIN in your test environment.`);
    }

    const apiServerPort = process.env.API_PORT;

    if (!apiServerPort) {
      throw new Error(`You need to set $API_PORT in your test environment.`);
    }

    const baseApiUrl = `${apiDomain}:${apiServerPort}`;

    console.log({ JHERERERERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR: baseApiUrl });

    /**
     * The commands endpoint uses strict schema-based type validation followed
     * by full state validation and finally escapes all user input. Further,
     * the DB being written to is an ephemeral e2e DB. There is no risk.
     */
    await axios.post(`${baseApiUrl}/surveys/commands`, fixtureData, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
  } catch (error) {
    const exception = new Error(
      `Failed to import test survey to the database.\n${error}`,
    );

    console.error(exception.message);

    throw exception;
  }
};
