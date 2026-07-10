// lilsculpr-admin/src/pages/Overview/Overview.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StatsCard, Button } from '../../components/common';
import { BatchSummary } from './BatchSummary';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { fetchFeesOverview } from '../../store/slices/feeSlice';
import { FEES_MONTHLY, KIT_FEE } from '../../utils/constants';
import { getSlotCount } from '../../utils/helpers';

export const Overview = () => {
  const dispatch = useDispatch();
  const { list: students, isLoading: studentsLoading } = useSelector((state) => state.students);
  const { batches, isLoading: batchesLoading } = useSelector((state) => state.batches);
  const { overview: feesOverview, isLoading: feesLoading } = useSelector((state) => state.fees);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchBatches());
    dispatch(fetchFeesOverview());
  }, [dispatch]);

  useEffect(() => {
    if (students.length > 0) {
      const active = students.filter(s => s.status === 'active');
      const rev = active.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
      setTotalRevenue(rev + (feesOverview?.paid?.total || 0));
    }
  }, [students, feesOverview]);

  if (studentsLoading || batchesLoading || feesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeStudents = students.filter(s => s.status === 'active');
  const offline = activeStudents.filter(s => s.classType === 'offline');
  const online = activeStudents.filter(s => s.classType === 'online');
  const feesPaid = feesOverview?.paid?.count || 0;
  const feesPending = feesOverview?.pending?.count || 0;

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard 
          label="Total Students" 
          value={activeStudents.length} 
          subLabel="active" 
          color="text-purple-600"
        />
        <StatsCard 
          label="Offline" 
          value={offline.length} 
          subLabel="Chennai centre" 
          color="text-primary"
        />
        <StatsCard 
          label="Online" 
          value={online.length} 
          subLabel="live sessions" 
          color="text-blue-500"
        />
        <StatsCard 
          label="Fees Paid" 
          value={feesPaid} 
          subLabel="monthly records" 
          color="text-green-500"
        />
        <StatsCard 
          label="Fee Pending" 
          value={feesPending} 
          subLabel="need collection" 
          color="text-red-500"
        />
        <StatsCard 
          label="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString('en-IN')}`} 
          subLabel="admissions + monthly" 
          color="text-primary"
        />
      </div>

      {/* Batch Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-nunito font-extrabold">📅 Batch Seat Summary</h3>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/batches'}>
            View All
          </Button>
        </div>
        <BatchSummary batches={batches} students={students} />
      </div>
    </div>
  );
};