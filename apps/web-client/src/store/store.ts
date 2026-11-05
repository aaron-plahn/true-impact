import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  clientSearchSlice,
  clientSearchSliceReducer,
} from "../components/clients";
import { clientsApi } from "../components/clients/store/clients.api";
import { surveyResponsesApi } from "../components/surveys/store/survey-responses.api";
import { surveyApi } from "../components/surveys/store/survey.api";

export const store = configureStore({
  reducer: {
    // persists the filter and pagination options for client index searches
    [clientSearchSlice.name]: clientSearchSliceReducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [surveyApi.reducerPath]: surveyApi.reducer,
    [surveyResponsesApi.reducerPath]: surveyResponsesApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .concat(clientsApi.middleware)
      .concat(surveyApi.middleware)
      .concat(surveyResponsesApi.middleware);
  },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
