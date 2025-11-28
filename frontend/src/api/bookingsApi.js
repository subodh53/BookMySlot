import axiosClient from "./axiosClient";

export const getMyBookingsApi = () => axiosClient.get('/bookings/getMyBookings');