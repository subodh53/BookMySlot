import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import eventTypeReducer from "../features/eventTypes/eventTypeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    eventTypes: eventTypeReducer,
  },
});

export default store;
