import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table } from '../../components/common/Table';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchFeesForMonth } from '../../store/slices/feeSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import api from '../../api/axios';
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

  // Dropdown options
  const ALL_MONTHS = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const ALL_YEARS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Show from 1 year ago to 3 years in the future
    return Array.from({ length: 5 }, (_, i) => (currentYear - 1 + i).toString());
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

  // ═══ FIX: Include both 'active' and 'paused' students, exclude 'cancelled' and 'deleted' ═══
  const activeStudents = useMemo(() => 
    students.filter(s => s.status === 'active' || s.status === 'paused'), 
    [students]
  );

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
        year: Number(feeYear),
        amount,
        status: newStatus,
        paymentMethod: newStatus === 'Paid' ? method : null,
      };
      
      await api.post(`/enrollment/students/${studentId}/fees`, payload);
      
      // Force sync paymentStatus and clear PENDING prefix via the frontend
      // (This guarantees the UI updates instantly even if the live backend is running an older version)
      if (newStatus === 'Paid') {
        await api.put(`/students/${studentId}`, {
          paymentStatus: 'Completed',
          paymentMethod: method,
          razorpayPaymentId: `MANUAL-${Date.now()}` // Strips the PENDING- prefix
        });
      } else {
        await api.put(`/students/${studentId}`, {
          paymentStatus: 'Pending'
        });
      }

      dispatch(fetchFeesForMonth({ month: feeMonth, year: feeYear }));
      dispatch(fetchStudents()); // Ensure student list in Redux receives the updated paymentStatus
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

  // ═══ FIX: Calculate stats using activeStudents (not all students) ═══
  const stats = useMemo(() => {
    let paidAmt = 0;
    let totalAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let notBilledCount = 0;

    activeStudents.forEach(s => {
      const sid = s._id || s.id;
      // Use String() to safely compare ObjectId vs string
      const record = monthFees.find(f => String(f.studentId) === String(sid));
      const monthlyFee = FEES_MONTHLY[s.classType] || 2500;
      
      // Check if this is the enrollment month (feeStartMonth is always set reliably)
      const isEnrollmentMonth = 
        s.feeStartMonth === feeMonth && 
        s.feeStartDate && 
        new Date(s.feeStartDate).getFullYear() === Number(feeYear);
      
      let isPaid = record && record.status === 'Paid';
      
      // If no fee record exists but this is the enrollment month and admission is paid
      if (!record && isEnrollmentMonth && s.paymentStatus === 'Completed') {
        isPaid = true;
      }
      
      // If no fee record exists and it's not the enrollment month → not billed yet
      const isNotBilled = !record && !isEnrollmentMonth;
      
      if (isNotBilled) {
        notBilledCount++;
        // Don't add to total if not billed
        return;
      }
      
      totalAmt += monthlyFee;
      
      if (isPaid) {
        paidAmt += monthlyFee;
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return { 
      totalAmt, 
      paidAmt, 
      pendingAmt: totalAmt - paidAmt, 
      paidCount, 
      pendingCount,
      notBilledCount,
      totalStudents: activeStudents.length
    };
  }, [activeStudents, monthFees, feeMonth, feeYear]);

  const isLoading = studentsLoading || feesLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Month & Year Selectors */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Select Month</label>
          <select 
            value={feeMonth} 
            onChange={(e) => setFeeMonth(e.target.value)}
            className="border-2 border-border rounded-lg px-4 py-2 bg-white text-secondary font-semibold focus:outline-none focus:border-secondary transition-colors"
          >
            {ALL_MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Select Year</label>
          <select 
            value={feeYear} 
            onChange={(e) => setFeeYear(e.target.value)}
            className="border-2 border-border rounded-lg px-4 py-2 bg-white text-secondary font-semibold focus:outline-none focus:border-secondary transition-colors"
          >
            {ALL_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row - Updated with Not Billed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col justify-center">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Total Expected</div>
          <div className="font-nunito text-2xl font-black text-secondary mt-1">₹{stats.totalAmt.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted mt-1">{feeMonth} {feeYear} · {stats.totalStudents} students</div>
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
        <div className="card p-4 flex flex-col justify-center bg-gray-50">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Not Billed</div>
          <div className="font-nunito text-2xl font-black text-gray-500 mt-1">{stats.notBilledCount}</div>
          <div className="text-xs text-muted mt-1">Enrolled this month</div>
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
          emptyMessage="No active or paused students found."
          renderRow={(s) => {
            const sid = s._id || s.id;
            // Use String() to safely compare ObjectId vs string
            const record = monthFees.find(f => String(f.studentId) === String(sid));
            
            // ═══ FIX: Use only feeStartMonth - it is always reliably set on enrollment ═══
            const isEnrollmentMonth = 
              s.feeStartMonth === feeMonth && 
              s.feeStartDate && 
              new Date(s.feeStartDate).getFullYear() === Number(feeYear);
            
            // ═══ FIX: Determine if fee is paid ═══
            let isPaid = record && record.status === 'Paid';
            let isNotBilled = false;
            
            // If no fee record exists but this is the enrollment month and admission is paid
            if (!record && isEnrollmentMonth && s.paymentStatus === 'Completed') {
              isPaid = true;
            }
            
            // If no fee record exists and it's not the enrollment month → not billed yet
            if (!record && !isEnrollmentMonth) {
              isNotBilled = true;
            }
            
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
                  {s.status === 'paused' && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                      ⏸️ Paused
                    </span>
                  )}
                  {isEnrollmentMonth && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block ml-1">
                      📌 Enrollment Month
                    </span>
                  )}
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
                  {isNotBilled ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                      Not Billed
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isPaid ? 'bg-green/10 text-green-700' : 'bg-red/10 text-red-700'
                    }`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {isPaid && record?.paidAt ? new Date(record.paidAt).toLocaleDateString('en-IN') : 
                   isPaid && isEnrollmentMonth ? s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—' :
                   '—'}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {isNotBilled ? (
                    <span className="text-xs text-muted">Not billed yet</span>
                  ) : isPaid ? (
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
