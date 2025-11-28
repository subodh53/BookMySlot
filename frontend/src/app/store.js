import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import eventTypeReducer from "../features/eventTypes/eventTypeSlice";
import availabilityReducer from "../features/availability/availabilitySlice";
import bookingsReducer from "../features/bookings/bookingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    eventTypes: eventTypeReducer,
    availability: availabilityReducer,
    bookings: bookingsReducer,
  },
});

export default store;
