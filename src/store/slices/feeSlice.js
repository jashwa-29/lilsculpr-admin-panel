import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchFeesOverview = createAsyncThunk(
  'fees/fetchOverview',
  async () => {
    const response = await api.get('/enrollment/fees/overview');
    if (response?.data?.success) {
      return response.data;
    }
    throw new Error('Failed to fetch fees overview');
  }
);

export const fetchFeesForMonth = createAsyncThunk(
  'fees/fetchForMonth',
  async ({ month, year }) => {
    const response = await api.get(`/enrollment/fees/month/${month}/${year}`);
    if (response?.data?.success) {
      // Backend returns { success: true, fees: [...] }
      return response.data.fees || [];
    }
    throw new Error('Failed to fetch fees for the month');
  }
);

const initialState = {
  overview: {
    paid: { total: 0, count: 0 },
    pending: { total: 0, count: 0 },
  },
  monthFees: [],
  isLoading: false,
  error: null,
};

const feeSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {
    clearFeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeesOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeesOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchFeesOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Failed to fetch fees overview';
      })
      .addCase(fetchFeesForMonth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeesForMonth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monthFees = action.payload;
      })
      .addCase(fetchFeesForMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Failed to fetch fees for month';
      });
  },
});

export const { clearFeeError } = feeSlice.actions;
export default feeSlice.reducer;

