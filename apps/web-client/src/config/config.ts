// TODO We should dynamically validate the TS type to catch config misconfiguration issues
// This isn't that important as long as we keep the config simple
export const config = {
  // @ts-expect-error we don't need to type the window object as it is opaque outside this file
  API_URL: (window.APP_CONFIG?.API_URL as string) || "http://localhost:4200",
  // @ts-expect-error same as above
  APP_ENV: (window.APP_CONFIG?.APP_ENV as string) || "production",
  KEYSTONE_EXCLUDES:
    // @ts-expect-error same as above
    (window.APP_CONFIG?.KEYSTONE_EXCLUDES as Set<string>) || new Set<string>(),
};
