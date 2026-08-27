import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { surveyResponsesApi } from "../components/surveys/store/survey-responses.api";
import { surveyApi } from "../components/surveys/store/survey.api";

export const store = configureStore({
  reducer: {
    [surveyApi.reducerPath]: surveyApi.reducer,
    [surveyResponsesApi.reducerPath]: surveyResponsesApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .concat(surveyApi.middleware)
      .concat(surveyResponsesApi.middleware);
  },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
