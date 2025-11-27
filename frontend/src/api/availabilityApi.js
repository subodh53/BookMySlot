import axiosClient from './axiosClient.js';

export const getAvailabilityApi = () => axiosClient.get('/availability/getAvailability');

export const saveAvailabilityApi = (payload) => axiosClient.post('/availability/upsertAvailability', payload);