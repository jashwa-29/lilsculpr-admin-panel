import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchWorkshopRegistrations = createAsyncThunk(
  'workshops/fetchRegistrations',
  async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.carnival && params.carnival !== 'all') query.set('carnival', params.carnival);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.payment_status && params.payment_status !== 'all') query.set('payment_status', params.payment_status);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const response = await api.get(`/special-course/admin/registrations?${query}`);
    return response.data;
  }
);

export const fetchWorkshopStats = createAsyncThunk(
  'workshops/fetchStats',
  async () => {
    const response = await api.get('/special-course/admin/statistics');
    return response.data;
  }
);

export const fetchWorkshopDetail = createAsyncThunk(
  'workshops/fetchDetail',
  async (registrationId) => {
    const response = await api.get(`/special-course/admin/registrations/${registrationId}`);
    return response.data;
  }
);

export const expireWorkshopRegistration = createAsyncThunk(
  'workshops/expire',
  async ({ registrationId, reason }) => {
    const response = await api.post('/special-course/admin/expire-registration', {
      registrationId,
      reason: reason || 'Manually expired by admin'
    });
    return response.data;
  }
);

const initialState = {
  registrations: [],
  stats: {
    summary: {
      totalRegistrations: 0,
      paidRegistrations: 0,
      pendingRegistrations: 0,
      expiredRegistrations: 0,
      successRate: '0%',
      conversionRate: '0%',
      totalRevenue: 0
    },
    carnivalStatistics: [],
    systemSettings: {}
  },
  selectedRegistration: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false
  },
  isLoading: false,
  isDetailLoading: false,
  error: null
};

const workshopSlice = createSlice({
  name: 'workshops',
  initialState,
  reducers: {
    clearSelectedRegistration: (state) => {
      state.selectedRegistration = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkshopRegistrations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkshopRegistrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registrations = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchWorkshopRegistrations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchWorkshopStats.fulfilled, (state, action) => {
        if (action.payload?.success) {
          state.stats = action.payload.data;
        }
      })
      .addCase(fetchWorkshopDetail.pending, (state) => {
        state.isDetailLoading = true;
      })
      .addCase(fetchWorkshopDetail.fulfilled, (state, action) => {
        state.isDetailLoading = false;
        state.selectedRegistration = action.payload?.data || null;
      })
      .addCase(fetchWorkshopDetail.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.error = action.error.message;
      })
      .addCase(expireWorkshopRegistration.fulfilled, (state, action) => {
        const regId = action.meta.arg.registrationId;
        state.registrations = state.registrations.filter(r => r.registrationId !== regId);
        if (state.selectedRegistration?.registrationId === regId) {
          state.selectedRegistration = null;
        }
      });
  }
});

export const { clearSelectedRegistration } = workshopSlice.actions;
export default workshopSlice.reducer;
