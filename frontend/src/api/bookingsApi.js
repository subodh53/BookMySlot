import axiosClient from "./axiosClient";

export const getMyBookingsApi = () => axiosClient.get('/bookings/getMyBookings');

export const updateBookingStatusApi = (id, status) => axiosClient.patch(`/bookings/${id}`, { status });