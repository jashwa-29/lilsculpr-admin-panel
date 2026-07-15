import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

/**
 * Fetch attendance records.
 * params: { date (YYYY-MM-DD) } for daily view
 *         { startDate, endDate } for monthly view  
 *         { viewType: 'daily' | 'monthly' }
 */
export const fetchAttendance = createAsyncThunk(
  'attendance/fetch',
  async (params) => {
    const response = await api.get('/enrollment/attendance', { params: {
      startDate: params.date || params.startDate,
      endDate: params.endDate || params.date,
      batchId: params.batchId,
    }});
    if (response?.data?.success) {
      return {
        records: response.data.attendance || response.data.records || [],
        viewType: params.viewType || 'daily',
      };
    }
    throw new Error('Failed to fetch attendance');
  }
);

export const saveAttendance = createAsyncThunk(
  'attendance/save',
  async (records) => {
    const response = await api.post('/enrollment/attendance', { records });
    if (response?.data?.success) {
      return records;
    }
    throw new Error('Failed to save attendance');
  }
);

const initialState = {
  dailyRecords: [],
  monthlyRecords: [],
  isLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
    clearMonthlyAttendance: (state) => {
      state.monthlyRecords = [];
    },
    clearDailyAttendance: (state) => {
      state.dailyRecords = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        const { records, viewType } = action.payload;
        if (viewType === 'monthly') {
          state.monthlyRecords = records;
        } else {
          state.dailyRecords = records;
        }
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Failed to fetch attendance';
      })
      .addCase(saveAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        const savedRecords = action.payload;
        savedRecords.forEach(saved => {
          if (saved.status === 'none') {
            state.dailyRecords = state.dailyRecords.filter(
              r => !(r.studentId === saved.studentId && r.date === saved.date)
            );
          } else {
            const existingDaily = state.dailyRecords.find(
              r => r.studentId === saved.studentId && r.date === saved.date
            );
            if (existingDaily) {
              existingDaily.status = saved.status;
            } else {
              state.dailyRecords.push(saved);
            }
          }
        });
      })
      .addCase(saveAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Failed to save attendance';
      });
  }
});

export const { clearAttendanceError, clearMonthlyAttendance, clearDailyAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;