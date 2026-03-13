import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  headerTitle: null,
  loading: false,
  loadingMessage: null,
  alert: { open: false, message: '', type: '' },
  setSessionEndModel: false
};

const commonReducersSlice = createSlice({
  name: "commonReducers",
  initialState,
  reducers: {
    setHeaderTitle(state, action) {
      state.headerTitle = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setLoadingMessage(state, action) {
      state.loadingMessage = action.payload;
    },
    setAlert(state, action) {
      state.alert = action.payload;
    },
    setSessionEndModel(state, action) {
      state.setSessionEndModel = action.payload;
    },
  },
});

export const {
  setHeaderTitle,
  setLoading,
  setLoadingMessage,
  setAlert,
  setSessionEndModel
} = commonReducersSlice.actions;

export default commonReducersSlice.reducer;