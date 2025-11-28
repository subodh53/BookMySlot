import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyBookingsApi } from '../../api/bookingsApi';

export const getMyBookings = createAsyncThunk(
    "bookings/getMyBookings",
    async(__dirname, thunkAPI) => {
        try {
            const res = await getMyBookingsApi();
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const bookingsSlice = createSlice({
    name: "bookings",
    initialState: {
        items: [],
        status: "idle",
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getMyBookings.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getMyBookings.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload.bookings || [];
            })
            .addCase(getMyBookings.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export default bookingsSlice.reducer;