import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const signupUser = createAsyncThunk(
    "auth/signupUser",
    async (payload, thunkAPI) => {
        try {
            const res = await axiosClient.post('/auth/signup', payload);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (payload, thunkAPI) => {
        try {
            const res = await axiosClient.post('/auth/login', payload);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

export const fetchMe = createAsyncThunk(
    "auth/fetchMe",
    async (_, thunkAPI) => {
        try {
            const res = await axiosClient.get('/auth/me');
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    status: 'idle',
    error: null,
    initialized: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('token');
        },
        setInitialized(state) {
            state.initialized = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(signupUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signupUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
        builder
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
        builder
            .addCase(fetchMe.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.initialized = true;
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.user = null;
                state.token = null;
                localStorage.removeItem('token');
                state.initialized = true;
            });
    },
});

export const { logout, setInitialized } = authSlice.actions;

export default authSlice.reducer;