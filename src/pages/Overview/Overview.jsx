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

  // ═══ FIX: Only show monthly fee collections (not admission fees) ═══
  useEffect(() => {
    if (feesOverview?.paid?.total) {
      setTotalRevenue(feesOverview.paid.total);
    } else {
      setTotalRevenue(0);
    }
  }, [feesOverview]);

  // Calculate current month's total expected fees
  const getCurrentMonthExpected = () => {
    const d = new Date();
    const currentMonth = d.toLocaleString('en-IN', { month: 'long' });
    const currentYear = d.getFullYear();
    
    const validStudents = students.filter(s => s.status === 'active' || s.status === 'paused');
    return validStudents.reduce((sum, s) => {
      const monthlyFee = FEES_MONTHLY[s.classType] || 2500;
      return sum + monthlyFee;
    }, 0);
  };

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

  // Only count active and paused students
  const validStudents = students.filter(s => s.status === 'active' || s.status === 'paused');
  const offline = validStudents.filter(s => s.classType === 'offline');
  const online = validStudents.filter(s => s.classType === 'online');
  
  // Fee stats from the fees overview (monthly collections)
  const feesPaid = feesOverview?.paid?.count || 0;
  const feesPending = feesOverview?.pending?.count || 0;
  const monthlyCollected = feesOverview?.paid?.total || 0;
  
  // Current month expected fees
  const currentMonthExpected = getCurrentMonthExpected();

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard 
          label="Total Students" 
          value={validStudents.length} 
          subLabel="active + paused" 
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
          value={`₹${monthlyCollected.toLocaleString('en-IN')}`} 
          subLabel="monthly fees collected" 
          color="text-primary"
        />
      </div>

      {/* Quick stats for current month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Current Month Expected</div>
          <div className="font-nunito text-2xl font-black text-blue-700 mt-1">
            ₹{currentMonthExpected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {validStudents.length} active/paused students × monthly fee
          </div>
        </div>
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wider">Total Collected (All Months)</div>
          <div className="font-nunito text-2xl font-black text-green-700 mt-1">
            ₹{monthlyCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-green-600 mt-1">
            From {feesPaid} paid fee records
          </div>
        </div>
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