import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchEventTypes = createAsyncThunk(
    "eventTypes/fetchEventTypes",
    async(_, thunkAPI) => {
        try {
            const res = await axiosClient.get('/eventTypes/getEventTypes');
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

export const createEventType = createAsyncThunk(
    "eventTypes/createEventType",
    async(payload, thunkAPI) => {
        try {
            const res = await axiosClient.post('/eventTypes/createEventType', payload);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
)

export const deleteEventType = createAsyncThunk(
    "eventTypes/deleteEventType",
    async(id, thunkAPI) => {
        try {
            await axiosClient.delete(`/eventTypes/deleteEventType/${id}`);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);


const eventTypeSlice = createSlice({
  name: "eventTypes",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    creating: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchEventTypes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEventTypes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEventTypes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // create
      .addCase(createEventType.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createEventType.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createEventType.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteEventType.fulfilled, (state, action) => {
        state.items = state.items.filter((et) => et._id !== action.payload);
      });
  },
});

export default eventTypeSlice.reducer;