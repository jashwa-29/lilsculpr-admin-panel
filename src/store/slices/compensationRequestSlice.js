import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCompensationRequests = createAsyncThunk(
  'compensationRequests/fetchAll',
  async (params) => {
    const response = await api.get('/compensation-requests', { params });
    return response.data;
  }
);

export const fetchRequestStats = createAsyncThunk(
  'compensationRequests/fetchStats',
  async () => {
    const response = await api.get('/compensation-requests/stats');
    return response.data;
  }
);

export const acceptRequest = createAsyncThunk(
  'compensationRequests/accept',
  async ({ id, adminNotes }) => {
    const response = await api.put(`/compensation-requests/${id}/accept`, { adminNotes });
    return response.data;
  }
);

export const rejectRequest = createAsyncThunk(
  'compensationRequests/reject',
  async ({ id, rejectionReason, adminNotes }) => {
    const response = await api.put(`/compensation-requests/${id}/reject`, { rejectionReason, adminNotes });
    return response.data;
  }
);

const initialState = {
  requests: [],
  stats: {
    pending: 0,
    accepted: 0,
    rejected: 0
  },
  isLoading: false,
  error: null
};

const compensationRequestSlice = createSlice({
  name: 'compensationRequests',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompensationRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompensationRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload.data || [];
      })
      .addCase(fetchCompensationRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchRequestStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        const updated = action.payload.data.request;
        const index = state.requests.findIndex(r => r._id === updated._id);
        if (index !== -1) state.requests[index] = updated;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const updated = action.payload.data.request;
        const index = state.requests.findIndex(r => r._id === updated._id);
        if (index !== -1) state.requests[index] = updated;
      });
  }
});

export default compensationRequestSlice.reducer;
