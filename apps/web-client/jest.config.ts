/* eslint-disable */
export default {
  testEnvironment: "jsdom",
  displayName: "True Impact Web Client",
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleNameMapper: {
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom",
    "\\.(css|less|scss|sass)$": "<rootDir>/test/mocks/style-mock.js",
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  setupFilesAfterEnv: ["./setupTests.js"],
};
