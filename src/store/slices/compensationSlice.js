import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCompensationsAdmin = createAsyncThunk(
  'compensations/fetchAdmin',
  async (params) => {
    const response = await api.get('/enrollment/compensations/admin', { params });
    return response.data;
  }
);

export const fetchCompensationStats = createAsyncThunk(
  'compensations/fetchStats',
  async () => {
    const response = await api.get('/enrollment/compensations/stats');
    return response.data;
  }
);

export const updateCompensationStatus = createAsyncThunk(
  'compensations/updateStatus',
  async ({ id, status }) => {
    const response = await api.put(`/enrollment/compensations/${id}`, { status });
    return response.data;
  }
);

const initialState = {
  records: [],
  stats: {
    total: 0,
    booked: 0,
    attended: 0,
    missed: 0,
    tokenStats: {},
    monthlyTrends: [],
    byBatchType: []
  },
  isLoading: false,
  error: null
};

const compensationSlice = createSlice({
  name: 'compensations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompensationsAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompensationsAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.data || [];
      })
      .addCase(fetchCompensationsAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCompensationStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      .addCase(updateCompensationStatus.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => r._id === action.payload.compensation._id);
        if (index !== -1) state.records[index] = action.payload.compensation;
      });
  }
});

export default compensationSlice.reducer;
