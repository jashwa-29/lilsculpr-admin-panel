import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { endpoints } from '../../api/endpoints';

export const fetchBatches = createAsyncThunk(
  'batches/fetchAll',
  async () => {
    const response = await endpoints.batches.getAll();
    if (response.success) {
      return response.batches;
    }
    throw new Error('Failed to fetch batches');
  }
);

export const createBatch = createAsyncThunk(
  'batches/create',
  async (batchData) => {
    const response = await endpoints.batches.create(batchData);
    if (response.success) {
      return response.batch;
    }
    throw new Error('Failed to create batch');
  }
);

export const completeBatch = createAsyncThunk(
  'batches/complete',
  async (batchId) => {
    const response = await endpoints.batches.complete(batchId);
    if (response.success) {
      return response.summary;
    }
    throw new Error('Failed to complete batch');
  }
);

const initialState = {
  batches: [],
  isLoading: false,
  error: null,
};

const batchSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.batches.push(action.payload);
      });
  },
});

export default batchSlice.reducer;
