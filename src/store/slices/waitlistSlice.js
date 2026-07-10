import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchWaitlist = createAsyncThunk(
  'waitlist/fetchAll',
  async () => {
    const response = await api.get('/waitlist');
    return response.data;
  }
);

export const fetchWaitlistStats = createAsyncThunk(
  'waitlist/fetchStats',
  async () => {
    const response = await api.get('/waitlist/stats');
    return response.data;
  }
);

export const addToWaitlist = createAsyncThunk(
  'waitlist/add',
  async (data) => {
    const response = await api.post('/waitlist', data);
    return response.data;
  }
);

export const notifyWaitlist = createAsyncThunk(
  'waitlist/notify',
  async ({ id, message }) => {
    const response = await api.put(`/waitlist/${id}/notify`, { message });
    return response.data;
  }
);

export const enrollWaitlist = createAsyncThunk(
  'waitlist/enroll',
  async (id) => {
    const response = await api.put(`/waitlist/${id}/enroll`);
    return response.data;
  }
);

export const removeFromWaitlist = createAsyncThunk(
  'waitlist/remove',
  async (id) => {
    const response = await api.delete(`/waitlist/${id}`);
    return response.data;
  }
);

const initialState = {
  entries: [],
  stats: {
    totalWaiting: 0,
    totalNotified: 0,
    totalEnrolled: 0,
    totalRemoved: 0,
    perBatch: []
  },
  isLoading: false,
  error: null
};

const waitlistSlice = createSlice({
  name: 'waitlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWaitlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWaitlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload.data || [];
      })
      .addCase(fetchWaitlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchWaitlistStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      .addCase(addToWaitlist.fulfilled, (state, action) => {
        state.entries.push(action.payload.data);
      })
      .addCase(notifyWaitlist.fulfilled, (state, action) => {
        const index = state.entries.findIndex(e => e._id === action.payload.data._id);
        if (index !== -1) state.entries[index] = action.payload.data;
      })
      .addCase(enrollWaitlist.fulfilled, (state, action) => {
        const index = state.entries.findIndex(e => e._id === action.payload.data._id);
        if (index !== -1) state.entries[index] = action.payload.data;
      })
      .addCase(removeFromWaitlist.fulfilled, (state, action) => {
        state.entries = state.entries.filter(e => e._id !== action.payload.data._id);
      });
  }
});

export default waitlistSlice.reducer;
