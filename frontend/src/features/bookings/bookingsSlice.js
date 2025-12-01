import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyBookingsApi, updateBookingStatusApi } from '../../api/bookingsApi';

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

export const updateBookingStatus = createAsyncThunk(
    "bookings/updateBookingStatus",
    async({ id, status }, thunkAPI) => {
        try {
            const res = await updateBookingStatusApi(id, status);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
)

const bookingsSlice = createSlice({
    name: "bookings",
    initialState: {
        items: [],
        status: "idle",
        error: null,
        updating: false,
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
            })
            .addCase(updateBookingStatus.pending, (state) => {
                state.updating = true;
            })
            .addCase(updateBookingStatus.fulfilled, (state, action) => {
                state.updating = false;
                const updated = action.payload.booking
                if(!updated) return;

                const index = state.items.findIndex((b) => b.id === updated.id);
                if(index !== -1){
                    state.items[index].status = updated.status;
                }
            })
            .addCase(updateBookingStatus.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
            });
    },
});

export default bookingsSlice.reducer;