import { configureStore } from '@reduxjs/toolkit';
import attendanceReducer from './slices/attendanceSlice';
import batchReducer from './slices/batchSlice';
import birthdayReducer from './slices/birthdaySlice';
import compensationReducer from './slices/compensationSlice';
import compensationRequestReducer from './slices/compensationRequestSlice';
import feeReducer from './slices/feeSlice';
import galleryReducer from './slices/gallerySlice';
import studentReducer from './slices/studentSlice';
import waitlistReducer from './slices/waitlistSlice';

export const store = configureStore({
  reducer: {
    attendance: attendanceReducer,
    batches: batchReducer,
    birthdays: birthdayReducer,
    compensations: compensationReducer,
    compensationRequests: compensationRequestReducer,
    fees: feeReducer,
    gallery: galleryReducer,
    students: studentReducer,
    waitlist: waitlistReducer,
  },
});
