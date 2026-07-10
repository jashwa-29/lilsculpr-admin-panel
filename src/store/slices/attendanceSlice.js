import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { endpoints } from '../../api/endpoints';

export const fetchAttendance = createAsyncThunk(
  'attendance/fetch',
  async (params) => {
    const response = await endpoints.attendance.get(params);
    if (response?.success) {
      // Return the records along with the viewType so the reducer knows where to store them
      return { records: response.attendance, viewType: params.viewType || 'daily' };
    }
    throw new Error('Failed to fetch attendance');
  }
);

export const fetchCompensations = createAsyncThunk(
  'attendance/fetchCompensations',
  async (params) => {
    const response = await endpoints.compensations.get(params);
    if (response?.success) {
      return response.compensations;
    }
    throw new Error('Failed to fetch compensations');
  }
);

export const saveAttendance = createAsyncThunk(
  'attendance/save',
  async (records) => {
    const response = await endpoints.attendance.update({ records });
    if (response?.success) {
      return records; // Return the saved records so we can update state
    }
    throw new Error('Failed to save attendance');
  }
);

const initialState = {
  dailyRecords: [], // For the daily view
  monthlyRecords: [], // For the monthly view
  compensations: [], // Array of compensation records
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
      .addCase(fetchCompensations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompensations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.compensations = action.payload || [];
      })
      .addCase(fetchCompensations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error?.message || 'Failed to fetch compensations';
      })
      .addCase(saveAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update local records with saved ones
        const savedRecords = action.payload;
        savedRecords.forEach(saved => {
          if (saved.status === 'none') {
            state.dailyRecords = state.dailyRecords.filter(r => !(r.studentId === saved.studentId && r.date === saved.date));
            state.monthlyRecords = state.monthlyRecords.filter(r => !(r.studentId === saved.studentId && r.date === saved.date));
          } else {
            // Update daily records
            const existingDaily = state.dailyRecords.find(r => r.studentId === saved.studentId && r.date === saved.date);
            if (existingDaily) {
              existingDaily.status = saved.status;
            } else {
              state.dailyRecords.push(saved);
            }
            // Update monthly records
            const existingMonthly = state.monthlyRecords.find(r => r.studentId === saved.studentId && r.date === saved.date);
            if (existingMonthly) {
              existingMonthly.status = saved.status;
            } else {
              state.monthlyRecords.push(saved);
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