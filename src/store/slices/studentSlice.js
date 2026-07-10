import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { endpoints } from '../../api/endpoints';

export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async () => {
    const response = await endpoints.students.getAll();
    if (response.success) {
      return response.students.map(s => ({
        ...s,
        id: s.enrollmentId || s._id,
        photo: s.photoUrl || '',
      }));
    }
    throw new Error('Failed to fetch students');
  }
);

export const fetchStudentFees = createAsyncThunk(
  'students/fetchFees',
  async (studentId) => {
    const response = await endpoints.students.getFees(studentId);
    if (response.success) {
      return { studentId, fees: response.fees };
    }
    throw new Error('Failed to fetch fees');
  }
);

export const markFeePaid = createAsyncThunk(
  'students/markFeePaid',
  async ({ studentId, data }) => {
    const response = await endpoints.students.markFeePaid(studentId, data);
    if (response.success) {
      return { studentId, feeData: data };
    }
    throw new Error('Failed to mark fee paid');
  }
);

export const createStudent = createAsyncThunk(
  'students/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await endpoints.students.createFormData(formData);
      if (response.success) {
        return response.student;
      }
      return rejectWithValue(response.error || 'Failed to create student');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStudentStatus = createAsyncThunk(
  'students/updateStatus',
  async ({ studentId, status }) => {
    const response = await endpoints.students.update(studentId, { status });
    if (response.success) {
      return { studentId, status };
    }
    throw new Error('Failed to update status');
  }
);

// ═══ NEW: Start level journey ═══
export const startLevelJourney = createAsyncThunk(
  'students/startLevel',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await endpoints.students.startLevel(studentId);
      if (response.success) {
        return response;
      }
      return rejectWithValue(response.error);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ═══ NEW: Advance level ═══
export const advanceLevel = createAsyncThunk(
  'students/advanceLevel',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await endpoints.students.advanceLevel(studentId);
      if (response.success) {
        return response;
      }
      return rejectWithValue(response.error);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ═══ NEW: Update student payment status ═══
export const updateStudentPayment = createAsyncThunk(
  'students/updatePayment',
  async ({ studentId, paymentData }) => {
    const response = await endpoints.students.update(studentId, paymentData);
    if (response.success) {
      return { studentId, ...paymentData };
    }
    throw new Error('Failed to update payment');
  }
);

export const deleteStudent = createAsyncThunk(
  'students/delete',
  async (studentId) => {
    const response = await endpoints.students.delete(studentId);
    if (response.success) {
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
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.fees[action.payload.studentId] = action.payload.fees;
      })
      .addCase(markFeePaid.fulfilled, (state, action) => {
        const { studentId, feeData } = action.payload;
        if (!state.fees[studentId]) {
          state.fees[studentId] = [];
        }
        state.fees[studentId].push({
          ...feeData,
          status: 'Paid',
          paidAt: new Date().toISOString(),
        });
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
      .addCase(updateStudentPayment.fulfilled, (state, action) => {
        const { studentId, paymentStatus, paymentMethod, amountPaid, razorpayPaymentId } = action.payload;
        const student = state.list.find(s => s.id === studentId || s._id === studentId);
        if (student) {
          if (paymentStatus) student.paymentStatus = paymentStatus;
          if (paymentMethod) student.paymentMethod = paymentMethod;
          if (amountPaid) student.amountPaid = amountPaid;
          if (razorpayPaymentId) student.razorpayPaymentId = razorpayPaymentId;
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload && s._id !== action.payload);
      });
  },
});

export const { clearError } = studentSlice.actions;
export default studentSlice.reducer;