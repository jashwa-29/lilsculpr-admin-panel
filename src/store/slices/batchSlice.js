import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchBatches = createAsyncThunk(
  'batches/fetchAll',
  async () => {
    const response = await api.get('/batches');
    const data = response.data;
    if (data.success) {
      return data.batches || data.data || [];
    }
    throw new Error('Failed to fetch batches');
  }
);

export const createBatch = createAsyncThunk(
  'batches/create',
  async (batchData, { rejectWithValue }) => {
    try {
      const response = await api.post('/batches', batchData);
      if (response.data.success) {
        return response.data.batch;
      }
      return rejectWithValue(response.data.error || 'Failed to create batch');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateBatch = createAsyncThunk(
  'batches/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/batches/${id}`, data);
      if (response.data.success) {
        return response.data.batch;
      }
      return rejectWithValue(response.data.error || 'Failed to update batch');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const completeBatch = createAsyncThunk(
  'batches/complete',
  async (batchId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/batches/${batchId}/complete`);
      if (response.data.success) {
        return { batchId, summary: response.data.summary };
      }
      return rejectWithValue(response.data.error || 'Failed to complete batch');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteBatch = createAsyncThunk(
  'batches/delete',
  async (batchId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/batches/${batchId}`);
      if (response.data.success) {
        return batchId;
      }
      return rejectWithValue(response.data.error || 'Failed to delete batch');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
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
  reducers: {
    clearBatchError: (state) => {
      state.error = null;
    },
  },
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
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.batches[index] = action.payload;
      })
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.batches = state.batches.filter(b => b._id !== action.payload);
      })
      .addCase(completeBatch.fulfilled, (state, action) => {
        const batch = state.batches.find(b => b._id === action.payload.batchId);
        if (batch) batch.status = 'completed';
      });
  },
});

export const { clearBatchError } = batchSlice.actions;
export default batchSlice.reducer;
