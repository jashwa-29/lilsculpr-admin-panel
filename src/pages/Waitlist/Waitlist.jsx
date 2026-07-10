import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SearchBar, Button, Modal, StatusPill, Table } from '../../components/common';
import { fetchWaitlist, notifyWaitlist, enrollWaitlist, removeFromWaitlist } from '../../store/slices/waitlistSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { getBatchShortName } from '../../utils/helpers';

export const Waitlist = () => {
  const dispatch = useDispatch();
  const { entries, stats, isLoading } = useSelector((state) => state.waitlist);
  const { batches } = useSelector((state) => state.batches);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  useEffect(() => {
    dispatch(fetchWaitlist());
    dispatch(fetchBatches());
  }, [dispatch]);

  const handleNotify = async () => {
    if (!selectedEntry) return;
    try {
      await dispatch(notifyWaitlist({ id: selectedEntry._id, message: notifyMessage })).unwrap();
      setShowNotifyModal(false);
      setNotifyMessage('');
      dispatch(fetchWaitlist());
      alert('Parent notified successfully!');
    } catch (error) {
      alert('Failed to notify: ' + error.message);
    }
  };

  const handleEnroll = async (entryId) => {
    if (!window.confirm('Enroll this student now? They will be moved to the batch.')) return;
    try {
      await dispatch(enrollWaitlist(entryId)).unwrap();
      dispatch(fetchWaitlist());
      alert('Student enrolled successfully!');
    } catch (error) {
      alert('Failed to enroll: ' + error.message);
    }
  };

  const handleRemove = async (entryId) => {
    if (!window.confirm('Remove this student from waitlist?')) return;
    try {
      await dispatch(removeFromWaitlist(entryId)).unwrap();
      dispatch(fetchWaitlist());
      alert('Removed from waitlist');
    } catch (error) {
      alert('Failed to remove: ' + error.message);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = entry.childName?.toLowerCase().includes(q) ||
                         entry.parentName?.toLowerCase().includes(q) ||
                         entry.contact1?.includes(q) ||
                         entry.email?.toLowerCase().includes(q);
    const matchesBatch = filterBatch === 'all' || entry.batchId?._id === filterBatch;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const getStatusVariant = (status) => {
    const variants = {
      waiting: 'yellow',
      notified: 'blue',
      enrolled: 'green',
      removed: 'gray'
    };
    return variants[status] || 'gray';
  };

  const columns = [
    { key: 'child', title: 'Student' },
    { key: 'parent', title: 'Parent' },
    { key: 'batch', title: 'Batch' },
    { key: 'status', title: 'Status' },
    { key: 'priority', title: 'Priority' },
    { key: 'waitingSince', title: 'Waiting Since' },
    { key: 'action', title: 'Action' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-extrabold">Waitlist Management</h3>
        <Button variant="primary" onClick={() => dispatch(fetchWaitlist())}>
          🔄 Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Waiting</div>
          <div className="font-nunito text-2xl font-black text-yellow-600 mt-1">{stats?.totalWaiting || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Notified</div>
          <div className="font-nunito text-2xl font-black text-blue-600 mt-1">{stats?.totalNotified || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Enrolled</div>
          <div className="font-nunito text-2xl font-black text-green-600 mt-1">{stats?.totalEnrolled || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Removed</div>
          <div className="font-nunito text-2xl font-black text-red-600 mt-1">{stats?.totalRemoved || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search student or parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:border-secondary outline-none"
        >
          <option value="all">All Batches</option>
          {batches.map(b => {
            // ═══ Use human-readable batch name ═══
            const displayName = getBatchShortName(b);
            return (
              <option key={b._id} value={b._id}>
                {displayName}
              </option>
            );
          })}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:border-secondary outline-none"
        >
          <option value="all">All Status</option>
          <option value="waiting">Waiting</option>
          <option value="notified">Notified</option>
          <option value="enrolled">Enrolled</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={filteredEntries}
          isLoading={isLoading}
          emptyMessage="No waitlist entries found"
          renderRow={(entry) => {
            // ═══ Get batch display name ═══
            const batchDisplayName = entry.batchId ? getBatchShortName(entry.batchId) : 'N/A';
            
            return (
              <tr key={entry._id} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{entry.childName}</div>
                  <div className="text-xs text-muted">ID: {entry.studentId?.enrollmentId || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{entry.parentName}</div>
                  <div className="text-xs text-muted">{entry.contact1}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {entry.batchId ? (
                    <>
                      <div>{entry.batchId.type === 'offline' ? '🏫' : '💻'} {batchDisplayName}</div>
                    </>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <StatusPill variant={getStatusVariant(entry.status)}>
                    {entry.status}
                  </StatusPill>
                </td>
                <td className="px-4 py-3 text-sm font-bold">#{entry.priority}</td>
                <td className="px-4 py-3 text-sm text-muted">
                  {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {entry.status === 'waiting' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowNotifyModal(true);
                          }}
                        >
                          Notify
                        </Button>
                        <Button
                          size="sm"
                          variant="green"
                          onClick={() => handleEnroll(entry._id)}
                        >
                          Enroll
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemove(entry._id)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                    {entry.status === 'notified' && (
                      <Button
                        size="sm"
                        variant="green"
                        onClick={() => handleEnroll(entry._id)}
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Notify Modal */}
      <Modal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        title="📧 Notify Parent"
        subtitle={`Send notification to ${selectedEntry?.parentName} about ${selectedEntry?.childName}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleNotify}>Send Notification</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg resize-y min-h-[120px]"
              placeholder="Enter a custom message for the parent..."
            />
            <p className="text-xs text-muted mt-1">
              A seat has opened up. The parent will be notified via email and SMS.
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ The parent has 24 hours to respond before their spot is released.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};