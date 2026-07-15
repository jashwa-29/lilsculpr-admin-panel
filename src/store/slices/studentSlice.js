import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async (batchId = null) => {
    const url = batchId ? `/students?batchId=${batchId}` : '/students';
    const response = await api.get(url);
    const data = response.data;
    if (data.success) {
      return (data.students || data.data || []).map(s => ({
        ...s,
        id: s.enrollmentId || s._id,
        photo: s.photoUrl || '',
      }));
    }
    throw new Error('Failed to fetch students');
  }
);

// Fetch students for a specific batch via dedicated endpoint
export const fetchStudentsByBatch = createAsyncThunk(
  'students/fetchByBatch',
  async (batchId) => {
    const response = await api.get(`/students/batch/${batchId}`);
    const data = response.data;
    if (data.success) {
      return (data.students || []).map(s => ({
        ...s,
        id: s.enrollmentId || s._id,
        photo: s.photoUrl || '',
      }));
    }
    throw new Error('Failed to fetch students for batch');
  }
);

export const createStudent = createAsyncThunk(
  'students/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/enrollment/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        return response.data.student;
      }
      return rejectWithValue(response.data.error || 'Failed to create student');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateStudentStatus = createAsyncThunk(
  'students/updateStatus',
  async ({ studentId, status }) => {
    const response = await api.put(`/students/${studentId}`, { status });
    if (response.data.success) {
      return { studentId, status };
    }
    throw new Error('Failed to update status');
  }
);

export const startLevelJourney = createAsyncThunk(
  'students/startLevel',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/students/${studentId}/start-level`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue(response.data.error);
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const advanceLevel = createAsyncThunk(
  'students/advanceLevel',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/students/${studentId}/advance-level`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue(response.data.error);
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'students/delete',
  async (studentId) => {
    const response = await api.delete(`/students/${studentId}`);
    if (response.data.success) {
      return studentId;
    }
    throw new Error('Failed to delete student');
  }
);

const initialState = {
  list: [],
  fees: {},
  isLoading: false,
  error: null,
};

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // fetchStudentsByBatch shares the same list store
      .addCase(fetchStudentsByBatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentsByBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchStudentsByBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateStudentStatus.fulfilled, (state, action) => {
        const { studentId, status } = action.payload;
        const student = state.list.find(s => s.id === studentId || s._id === studentId);
        if (student) {
          student.status = status;
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload && s._id !== action.payload);
      });
  },
});

export const { clearError } = studentSlice.actions;
export default studentSlice.reducer;