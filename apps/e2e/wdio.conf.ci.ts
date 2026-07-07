import { config as baseConfig } from "./wdio.conf";

export const config = {
  ...baseConfig,
  // We override the capabilities to support headless execution in the CI pipeline
  capabilities: [
    {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
        ],
      },
    },
  ],
};
