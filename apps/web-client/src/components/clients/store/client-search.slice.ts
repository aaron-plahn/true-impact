import { createSlice } from "@reduxjs/toolkit";

type PaginationOptions = {
  page: number;
  pageSize: number;
};

type SearchSliceState = {
  searchTerms: Record<string, string | number | boolean>;
  pagination: PaginationOptions;
};

const buildEmptySearchState = (): SearchSliceState => ({
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
      state: SearchSliceState,
      action: { payload: { page: number } },
    ) => {
      state.pagination.page = action.payload.page;
    },
    setClientListPageSize: (
      state: SearchSliceState,
      action: { payload: { pageSize: number } },
    ) => {
      state.pagination.pageSize = action.payload.pageSize;
    },
    setClientSearchTermsForField: (
      state: SearchSliceState,
      {
        payload: { field, value },
      }: { payload: { field: string; value: string | number | boolean } },
    ) => {
      // overwrite the search value for this field and leave the others as is
      state.searchTerms[field] = value;
    },
    clearClientSearchTerms: (state: SearchSliceState) => {
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
} = clientSearchSlice.actions;

export const clientSearchSliceReducer = clientSearchSlice.reducer;
