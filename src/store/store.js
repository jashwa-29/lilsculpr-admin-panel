import { configureStore } from '@reduxjs/toolkit';
import studentReducer from './slices/studentSlice';
import batchReducer from './slices/batchSlice';
import feeReducer from './slices/feeSlice';
import attendanceReducer from './slices/attendanceSlice';
import waitlistReducer from './slices/waitlistSlice';
import compensationReducer from './slices/compensationSlice';
import birthdayReducer from './slices/birthdaySlice';

export const store = configureStore({
  reducer: {
    students: studentReducer,
    batches: batchReducer,
    fees: feeReducer,
    attendance: attendanceReducer,
    waitlist: waitlistReducer,
    compensations: compensationReducer,
    birthdays: birthdayReducer,
  },
});
