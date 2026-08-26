import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";

export const importSurvey = async (
  relativePath: string,
  cookieHeader?: string,
): Promise<void> => {
  try {
    const absolutePath = path.resolve(process.cwd(), relativePath);

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

    await axios.post("http://localhost:3234/surveys/commands", fixtureData, {
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
