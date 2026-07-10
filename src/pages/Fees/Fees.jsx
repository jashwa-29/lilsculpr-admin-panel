import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table } from '../../components/common/Table';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchFeesForMonth } from '../../store/slices/feeSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { endpoints } from '../../api/endpoints';
import { FEES_MONTHLY, KIT_FEE } from '../../utils/constants';

export const Fees = () => {
  const dispatch = useDispatch();
  
  const { list: students, isLoading: studentsLoading } = useSelector((state) => state.students);
  const { monthFees, isLoading: feesLoading } = useSelector((state) => state.fees);
  const { batches } = useSelector((state) => state.batches);

  const [feeMonth, setFeeMonth] = useState('');
  const [feeYear, setFeeYear] = useState('');
  
  // Initialize current month/year
  useEffect(() => {
    const d = new Date();
    setFeeMonth(d.toLocaleString('en-IN', { month: 'long' }));
    setFeeYear(d.getFullYear().toString());
  }, []);

  // Generate month tabs (-1 to +2 months)
  const monthTabs = useMemo(() => {
    const tabs = [];
    for (let i = -1; i <= 2; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      tabs.push({
        label: d.toLocaleString('en-IN', { month: 'long' }),
        year: d.getFullYear().toString(),
        display: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      });
    }
    return tabs;
  }, []);

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchBatches());
  }, [dispatch]);

  // Fetch fees whenever selected month changes
  useEffect(() => {
    if (feeMonth && feeYear) {
      dispatch(fetchFeesForMonth({ month: feeMonth, year: feeYear }));
    }
  }, [feeMonth, feeYear, dispatch]);

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);

  const toggleFeeStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      let amount = 2500;
      let method = 'UPI';
      if (newStatus === 'Paid') {
        const student = activeStudents.find(s => s._id === studentId || s.id === studentId);
        amount = FEES_MONTHLY[student?.classType] || 2500;
        
        const amountStr = window.prompt(`Enter the fee amount collected for ${feeMonth} ${feeYear}:`, amount);
        if (amountStr === null) return;
        amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid amount.");
          return;
        }
        
        const methodStr = window.prompt(`Enter Payment Method (e.g., Cash, UPI, Bank Transfer):`, "UPI");
        if (methodStr === null) return;
        method = methodStr;
      }
      
      const payload = {
        month: feeMonth,
        year: Number(feeYear),  // Backend expects Number, not string
        amount,
        status: newStatus,
        paymentMethod: newStatus === 'Paid' ? method : null,
      };
      
      await endpoints.students.markFeePaid(studentId, payload);
      dispatch(fetchFeesForMonth({ month: feeMonth, year: feeYear }));
    } catch (error) {
      console.error('Failed to update fee status:', error);
      alert('Error updating fee status');
    }
  };

  const sendReminder = (student) => {
    const monthlyFee = FEES_MONTHLY[student.classType] || 2500;
    const msg = encodeURIComponent(`Hi ${student.parentName}! 🎨 Gentle reminder from Lil Sculpr — ${student.childName}'s monthly fee of ₹${monthlyFee.toLocaleString('en-IN')} for ${feeMonth} is due. Please pay by the 5th to continue ${student.childName}'s clay classes. Thank you! 🏺`);
    window.open(`https://wa.me/91${student.contact1.replace(/\D/g,'')}?text=${msg}`,'_blank');
  };

  // Compute stats for the selected month
  const stats = useMemo(() => {
    let paidAmt = 0;
    let totalAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;

    activeStudents.forEach(s => {
      const feeRecord = monthFees.find(f => (f.studentId === s._id || f.studentId === s.id));
      const monthlyFee = FEES_MONTHLY[s.classType] || 2500;
      totalAmt += monthlyFee;
      
      if (feeRecord && feeRecord.status === 'Paid') {
        paidAmt += monthlyFee;
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return { totalAmt, paidAmt, pendingAmt: totalAmt - paidAmt, paidCount, pendingCount };
  }, [activeStudents, monthFees]);

  const isLoading = studentsLoading || feesLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Month Tabs */}
      <div className="flex gap-2 flex-wrap">
        {monthTabs.map(tab => {
          const isActive = tab.label === feeMonth && tab.year === feeYear;
          return (
            <button
              key={`${tab.label}-${tab.year}`}
              onClick={() => { setFeeMonth(tab.label); setFeeYear(tab.year); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                isActive 
                  ? 'bg-secondary text-white border-2 border-secondary' 
                  : 'bg-white text-muted border-2 border-border hover:border-secondary/50'
              }`}
            >
              {tab.display}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col justify-center">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Total Expected</div>
          <div className="font-nunito text-2xl font-black text-secondary mt-1">₹{stats.totalAmt.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted mt-1">{feeMonth} {feeYear}</div>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Collected</div>
          <div className="font-nunito text-2xl font-black text-green mt-1">₹{stats.paidAmt.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted mt-1">{stats.paidCount} students</div>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Pending</div>
          <div className="font-nunito text-2xl font-black text-red mt-1">₹{stats.pendingAmt.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted mt-1">{stats.pendingCount} students</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <Table
          columns={[
            { key: 'student', title: 'Student' },
            { key: 'batch', title: 'Batch' },
            { key: 'monthlyFee', title: 'Monthly Fee' },
            { key: 'kitFee', title: 'Kit Dues' },
            { key: 'total', title: 'Total Due' },
            { key: 'status', title: 'Status' },
            { key: 'paidOn', title: 'Paid On' },
            { key: 'action', title: 'Action' },
          ]}
          data={activeStudents}
          isLoading={isLoading}
          emptyMessage="No active students found."
          renderRow={(s) => {
            const sid = s._id || s.id;
            const record = monthFees.find(f => f.studentId === sid);
            const isPaid = record && record.status === 'Paid';
            const mFee = FEES_MONTHLY[s.classType] || 2500;
            const kitDue = s.kitOptIn && !s.kitPaid ? KIT_FEE : 0;
            const totalDue = mFee + kitDue;
            
            const batchTypeLbl = s.classType === 'offline' ? 'Offline' : 'Online';
            const dayLbl = s.dayId === 'monfri' ? 'Mon/Fri' : s.dayId === 'tuethu' ? 'Tue/Thu' : 'Sat/Sun';

            return (
              <tr key={sid} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{s.childName}</div>
                  <div className="text-xs text-muted">{s.parentName} · {s.contact1}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.classType === 'offline' ? 'bg-blue/10 text-blue' : 'bg-secondary/10 text-secondary'
                  }`}>{batchTypeLbl}</span>
                  <div className="mt-1">{dayLbl} · {s.time}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">₹{mFee.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm">{kitDue ? <span className="text-primary-dk font-semibold">₹{KIT_FEE.toLocaleString('en-IN')}</span> : '—'}</td>
                <td className="px-4 py-3 text-sm font-bold">₹{totalDue.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isPaid ? 'bg-green/10 text-green-700' : 'bg-red/10 text-red-700'
                  }`}>
                    {isPaid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {isPaid && record.paidAt ? new Date(record.paidAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {isPaid ? (
                    <button 
                      onClick={() => toggleFeeStatus(sid, 'Paid')}
                      className="text-xs font-semibold px-3 py-1.5 border-2 border-border text-muted hover:border-red hover:text-red rounded-lg transition-colors"
                    >
                      ↩ Undo
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleFeeStatus(sid, 'Pending')}
                        className="text-xs font-bold px-3 py-1.5 bg-primary hover:bg-primary-dk text-white rounded-lg transition-colors shadow-sm"
                      >
                        ✅ Mark Paid
                      </button>
                      <button 
                        onClick={() => sendReminder(s)}
                        title="Send WhatsApp Reminder"
                        className="text-xs font-bold px-2 py-1.5 border-2 border-border text-muted hover:border-green hover:text-green rounded-lg transition-colors"
                      >
                        📲
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>
    </div>
  );
};
