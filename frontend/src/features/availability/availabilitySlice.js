import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAvailabilityApi, saveAvailabilityApi } from '../../api/availabilityApi';

export const fetchAvailability = createAsyncThunk(
    "availability/fetchAvailability",
    async (_, thunkAPI) => {
        try {
            const res = await getAvailabilityApi();
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const saveAvailability = createAsyncThunk(
    "availability/saveAvailability",
    async (payload, thunkAPI) => {
        try {
            const res = await saveAvailabilityApi(payload);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const availabilitySlice = createSlice({
    name: "availability",
    initialState: {
        weekly: [],
        exceptions: [],
        status: "idle",
        error: null,
        saving: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailability.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchAvailability.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.weekly = action.payload.weekly || [];
                state.exceptions = action.payload.exceptions || [];
            })
            .addCase(fetchAvailability.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(saveAvailability.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveAvailability.fulfilled, (state, action) => {
                state.saving = false;
                state.weekly = action.payload.weekly || [];
                state.exceptions = action.payload.exceptions || [];
            })
            .addCase(saveAvailability.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            });
    },
});

export default availabilitySlice.reducer;