import { createSlice } from "@reduxjs/toolkit";

type PaginationOptions = {
  page: number;
  pageSize: number;
};

export type ClientSearchSliceState = {
  searchTerms: Record<string, string | number | boolean>;
  pagination: PaginationOptions;
};

const buildEmptySearchState = (): ClientSearchSliceState => ({
  searchTerms: {},
  pagination: {
    page: 1,
    pageSize: 10,
  },
});

export const clientSearchSlice = createSlice({
  name: "clientSearch",
  initialState: buildEmptySearchState(),
  reducers: {
    setClientListPage: (
      state: ClientSearchSliceState,
      action: { payload: { page: number } },
    ) => {
      state.pagination.page = action.payload.page;
    },
    setClientListPageSize: (
      state: ClientSearchSliceState,
      action: { payload: { pageSize: number } },
    ) => {
      state.pagination.pageSize = action.payload.pageSize;
    },
    setClientSearchTermsForField: (
      state: ClientSearchSliceState,
      {
        payload: { field, value },
      }: { payload: { field: string; value: string | number | boolean } },
    ) => {
      // overwrite the search value for this field and leave the others as is
      state.searchTerms[field] = value;
    },
    clearClientSearchField: (
      state: ClientSearchSliceState,
      { payload: { field } }: { payload: { field: string } },
    ) => {
      if (field in state.searchTerms) {
        delete state.searchTerms[field];
      }
    },
    clearClientSearchTerms: (state: ClientSearchSliceState) => {
      // we leave the pagination options alone
      state.searchTerms = {};
    },
  },
});

export const {
  setClientListPage,
  setClientListPageSize,
  setClientSearchTermsForField,
  clearClientSearchTerms,
  clearClientSearchField,
} = clientSearchSlice.actions;

export const clientSearchSliceReducer = clientSearchSlice.reducer;
