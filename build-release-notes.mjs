import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import readline from "readline";

const changelogFilePath = "CHANGELOG.md";

const outputFilepath = "ReleaseNotes.md";

const githubPrBaseUrl = "https://github.com/aaron-plahn/true-impact/pull";

/**
 *
 * @param {string} line
 * @returns string Transformed line
 */
const processLine = (line) => {
  const pattern = /## \d/i;

  if (pattern.test(line)) {
    const withoutHashtagsAndSpaces = line.replaceAll("#", "").trim();

    try {
      const prNumber = Number.parseInt(withoutHashtagsAndSpaces);

      const prLink = `${githubPrBaseUrl}/${prNumber}`;

      const newLine = `## #[${prNumber}](${prLink})`;

      return newLine;
    } catch {
      throw new Error(`Failed to parse number from h2 line: ${line}`);
    }
  }

  // no transformation applied
  return line;
};

async function processLines(source, destination) {
  // can't we use the async API for this?
  const doesFileAlreadyExist = existsSync(destination);

  if (doesFileAlreadyExist) {
    await unlink(destination).catch((err) => {
      if (err) {
        throw err;
      }
    });

    console.log(`Removed file: ${destination}`);
  }

  const writeStream = createWriteStream(destination, { flags: "w" });

  writeStream.on("error", (err) => {
    throw err;
  });

  const fileStream = createReadStream(source);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const transformed = processLine(line);

    writeStream.write(transformed, (err) => {
      if (err) {
        throw err;
      }
    });
    writeStream.write("\n");
  }

  writeStream.end(() => {
    console.log(`Successfully wrote new contents to ${destination}`);
  });
}

processLines(changelogFilePath, outputFilepath).catch((err) => {
  throw err;
});
