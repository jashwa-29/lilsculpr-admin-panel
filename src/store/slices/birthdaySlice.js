import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchBirthdays = createAsyncThunk(
  'birthdays/fetchAll',
  async () => {
    const response = await api.get('/birthdays');
    return response.data;
  }
);

export const fetchTodayBirthdays = createAsyncThunk(
  'birthdays/fetchToday',
  async () => {
    const response = await api.get('/birthdays/today');
    return response.data;
  }
);

export const fetchUpcomingBirthdays = createAsyncThunk(
  'birthdays/fetchUpcoming',
  async (days = 7) => {
    const response = await api.get(`/birthdays/upcoming?days=${days}`);
    return response.data;
  }
);

export const syncBirthdays = createAsyncThunk(
  'birthdays/sync',
  async () => {
    const response = await api.post('/birthdays/sync');
    return response.data;
  }
);

export const deleteBirthday = createAsyncThunk(
  'birthdays/delete',
  async (id) => {
    const response = await api.delete(`/birthdays/${id}`);
    return response.data;
  }
);

const initialState = {
  birthdays: [],
  today: [],
  upcoming: [],
  isLoading: false,
  error: null
};

const birthdaySlice = createSlice({
  name: 'birthdays',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBirthdays.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBirthdays.fulfilled, (state, action) => {
        state.isLoading = false;
        state.birthdays = action.payload.data || [];
      })
      .addCase(fetchBirthdays.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTodayBirthdays.fulfilled, (state, action) => {
        state.today = action.payload.data || [];
      })
      .addCase(fetchUpcomingBirthdays.fulfilled, (state, action) => {
        state.upcoming = action.payload.data || [];
      })
      .addCase(deleteBirthday.fulfilled, (state, action) => {
        // Need to refetch in component or filter here, component refetches anyway
      });
  }
});

export default birthdaySlice.reducer;
