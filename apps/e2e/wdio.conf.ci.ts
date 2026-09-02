import { config as baseConfig } from "./wdio.conf";

export const config = {
  ...baseConfig,
  // We override the capabilities to support headless execution in the CI pipeline
  capabilities: [
    {
      browserName: "chrome",
      browserVersion: "stable",
      "goog:chromeOptions": {
        args: [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--window-size=1920,1080", // Force resolution here
          "--force-device-scale-factor=1", // Prevents high-DPI scaling bugs in CI
        ],
      },
    },
  ],
};
