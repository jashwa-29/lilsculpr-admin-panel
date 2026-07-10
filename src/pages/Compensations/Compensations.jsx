import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SearchBar, Button, StatusPill, Table } from '../../components/common';
import { fetchCompensationsAdmin, updateCompensationStatus, fetchCompensationStats } from '../../store/slices/compensationSlice';

export const Compensations = () => {
  const dispatch = useDispatch();
  const { records, stats, isLoading } = useSelector((state) => state.compensations);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBatchType, setFilterBatchType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterBatchType !== 'all') params.batchType = filterBatchType;
    dispatch(fetchCompensationsAdmin(params));
    dispatch(fetchCompensationStats());
  }, [dispatch, startDate, endDate, filterStatus, filterBatchType]);

  // ─── UPDATED: Handle status change with date validation ──────────
  const handleStatusChange = async (id, currentStatus) => {
    // Find the record to get its date
    const record = records.find(r => r._id === id);
    if (!record) {
      alert('Record not found.');
      return;
    }

    // Check if the date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    // If the date is in the future, prevent marking as Attended
    if (recordDate > today && currentStatus !== 'Attended') {
      alert('Cannot mark a future compensation class as "Attended".\nPlease wait until the class date has passed.');
      return;
    }

    const nextStatus = currentStatus === 'Booked' ? 'Attended' : 
                      currentStatus === 'Attended' ? 'Missed' : 'Booked';

    // Prevent marking as Missed if the date is in the future
    if (recordDate > today && nextStatus === 'Missed') {
      alert('Cannot mark a future compensation class as "Missed".\nPlease wait until the class date has passed.');
      return;
    }

    if (!window.confirm(`Change status from ${currentStatus} to ${nextStatus}?`)) return;
    
    try {
      await dispatch(updateCompensationStatus({ id, status: nextStatus })).unwrap();
      alert('Status updated successfully');
      // Refresh the data
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterBatchType !== 'all') params.batchType = filterBatchType;
      dispatch(fetchCompensationsAdmin(params));
      dispatch(fetchCompensationStats());
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const studentName = record.studentId?.childName || '';
    const parentName = record.studentId?.parentName || '';
    return studentName.toLowerCase().includes(q) || parentName.toLowerCase().includes(q);
  });

  // ─── Helper to check if a date is in the past ────────────────────
  const isDateInPast = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date <= today;
  };

  const columns = [
    { key: 'student', title: 'Student' },
    { key: 'date', title: 'Date' },
    { key: 'batch', title: 'Batch' },
    { key: 'status', title: 'Status' },
    { key: 'token', title: 'Token' },
    { key: 'action', title: 'Action' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-extrabold">Compensation Management</h3>
        <Button variant="primary" onClick={() => {
          const params = {};
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
          if (filterStatus !== 'all') params.status = filterStatus;
          if (filterBatchType !== 'all') params.batchType = filterBatchType;
          dispatch(fetchCompensationsAdmin(params));
        }}>
          🔄 Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Total</div>
          <div className="font-nunito text-2xl font-black text-purple-600 mt-1">{stats?.total || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Booked</div>
          <div className="font-nunito text-2xl font-black text-yellow-600 mt-1">{stats?.booked || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Attended</div>
          <div className="font-nunito text-2xl font-black text-green-600 mt-1">{stats?.attended || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Missed</div>
          <div className="font-nunito text-2xl font-black text-red-600 mt-1">{stats?.missed || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        />
        <span className="text-muted">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="Booked">Booked</option>
          <option value="Attended">Attended</option>
          <option value="Missed">Missed</option>
        </select>
        <select
          value={filterBatchType}
          onChange={(e) => setFilterBatchType(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={filteredRecords}
          isLoading={isLoading}
          emptyMessage="No compensation records found"
          renderRow={(record) => {
            const isPast = isDateInPast(record.date);
            const isFuture = !isPast;
            const canChange = isPast && record.status !== 'Missed';
            
            return (
              <tr key={record._id} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{record.studentId?.childName || 'Unknown'}</div>
                  <div className="text-xs text-muted">{record.studentId?.parentName || ''} · {record.studentId?.contact1 || ''}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(record.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                  {isFuture && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Upcoming
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{record.batchType === 'offline' ? '🏫 Offline' : '💻 Online'}</div>
                  <div className="text-xs text-muted">{record.dayId} · {record.time}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill variant={
                    record.status === 'Attended' ? 'green' :
                    record.status === 'Booked' ? 'yellow' :
                    'red'
                  }>
                    {record.status}
                  </StatusPill>
                  {isFuture && record.status === 'Booked' && (
                    <div className="text-[10px] text-muted mt-1">⏳ Pending</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {record.tokenDetails ? (
                    <>
                      <StatusPill variant={
                        record.tokenDetails.status === 'used' ? 'green' :
                        record.tokenDetails.status === 'available' ? 'yellow' :
                        'red'
                      }>
                        {record.tokenDetails.status}
                      </StatusPill>
                      <div className="text-xs text-muted mt-1">
                        Exp: {new Date(record.tokenDetails.expiryDate).toLocaleDateString('en-IN')}
                      </div>
                    </>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  {canChange ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(record._id, record.status)}
                    >
                      {record.status === 'Booked' ? '✅ Mark Attended' : '📝 Mark Missed'}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">
                      {isFuture ? '⏳ Wait until class date' : 'No action'}
                    </span>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Monthly Trends */}
      {stats?.monthlyTrends?.length > 0 && (
        <div className="card p-6">
          <h4 className="font-nunito font-bold mb-4">Monthly Trends</h4>
          <div className="flex flex-wrap gap-4">
            {stats.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex-1 min-w-[80px] text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-muted">{trend.month}</div>
                <div className="font-bold text-lg">{trend.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Compensations;