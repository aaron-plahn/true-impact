// nosemgrep
// See comments below about why there is no risk of unauthorized file system traversal here
import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";

export const importSurvey = async (
  relativePath: string,
  cookieHeader?: string,
): Promise<void> => {
  try {
    const baseDir = path.resolve("features/support/fixtures/surveys")

    const absolutePath = path.resolve(baseDir, relativePath);

    if(!absolutePath.startsWith(`${baseDir}${path.sep}`)){
      throw new Error(`Unauthorized path traversal detected.`)
    }

    const rawData = await fs.readFile(absolutePath, "utf-8");

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

    const baseApiUrl = `http://${apiDomain}:${apiServerPort}`;

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
