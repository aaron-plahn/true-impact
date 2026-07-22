export const config = {
  // @ts-expect-error we don't need to type the window object as it is opaque outside this file
  API_URL: window.APP_CONFIG?.API_URL || "http://localhost:4200",
  // @ts-expect-error same as above
  APP_ENV: window.APP_CONFIG?.APP_ENV || "production",
};
