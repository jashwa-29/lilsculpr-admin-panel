import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, StatusPill, Table, SearchBar } from '../../components/common';
import { fetchCompensationRequests, acceptRequest, rejectRequest, fetchRequestStats } from '../../store/slices/compensationRequestSlice';

export const CompensationRequests = () => {
  const dispatch = useDispatch();
  const { requests, stats, isLoading } = useSelector((state) => state.compensationRequests);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    dispatch(fetchCompensationRequests());
    dispatch(fetchRequestStats());
  }, [dispatch]);

  const handleAccept = async (request) => {
    if (!window.confirm(`Accept compensation request for ${request.childName} on ${new Date(request.requestedDate).toLocaleDateString('en-IN')}?`)) {
      return;
    }
    try {
      await dispatch(acceptRequest({ id: request._id, adminNotes })).unwrap();
      setAdminNotes('');
      dispatch(fetchCompensationRequests());
      dispatch(fetchRequestStats());
      alert('✅ Request accepted successfully!');
    } catch (error) {
      alert('❌ Failed to accept: ' + error.message);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      await dispatch(rejectRequest({ id: selectedRequest._id, rejectionReason, adminNotes })).unwrap();
      setShowRejectModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedRequest(null);
      dispatch(fetchCompensationRequests());
      dispatch(fetchRequestStats());
      alert('✅ Request rejected successfully');
    } catch (error) {
      alert('❌ Failed to reject: ' + error.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = req.childName?.toLowerCase().includes(q) ||
                         req.parentName?.toLowerCase().includes(q) ||
                         req.contact1?.includes(q) ||
                         req.studentId?.enrollmentId?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'yellow',
      accepted: 'green',
      rejected: 'red'
    };
    return variants[status] || 'gray';
  };

  const columns = [
    { key: 'student', title: 'Student' },
    { key: 'requested', title: 'Requested Class' },
    { key: 'reason', title: 'Reason' },
    { key: 'status', title: 'Status' },
    { key: 'action', title: 'Action' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-extrabold">Compensation Requests</h3>
        <Button variant="primary" onClick={() => {
          dispatch(fetchCompensationRequests());
          dispatch(fetchRequestStats());
        }}>
          🔄 Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Pending</div>
          <div className="font-nunito text-2xl font-black text-yellow-600 mt-1">{stats?.pending || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Accepted</div>
          <div className="font-nunito text-2xl font-black text-green-600 mt-1">{stats?.accepted || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Rejected</div>
          <div className="font-nunito text-2xl font-black text-red-600 mt-1">{stats?.rejected || 0}</div>
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-xs text-muted">
          {filteredRequests.length} requests
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          emptyMessage="No compensation requests found"
          renderRow={(request) => {
            const isPending = request.status === 'pending';
            const isAccepted = request.status === 'accepted';
            const isRejected = request.status === 'rejected';

            return (
              <tr key={request._id} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{request.childName}</div>
                  <div className="text-xs text-muted">{request.parentName} · {request.contact1}</div>
                  <div className="text-xs text-muted">ID: {request.studentId?.enrollmentId || 'N/A'}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{new Date(request.requestedDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                  <div className="text-xs text-muted">{request.requestedBatchType === 'offline' ? '🏫 Offline' : '💻 Online'} · {request.requestedTime}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {request.reason || <span className="text-xs text-muted">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusPill variant={getStatusVariant(request.status)}>
                    {request.status}
                  </StatusPill>
                  {isRejected && request.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">Reason: {request.rejectionReason}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="green"
                        onClick={() => handleAccept(request)}
                      >
                        ✅ Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectionReason('');
                          setAdminNotes('');
                          setShowRejectModal(true);
                        }}
                      >
                        ❌ Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">
                      {isAccepted ? '✅ Processed' : '❌ Rejected'}
                    </span>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setRejectionReason('');
          setAdminNotes('');
        }}
        title="❌ Reject Compensation Request"
        subtitle={`Reject request for ${selectedRequest?.childName}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowRejectModal(false);
              setSelectedRequest(null);
              setRejectionReason('');
              setAdminNotes('');
            }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Reject Request
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg resize-y min-h-[80px]"
              placeholder="Please explain why this request is being rejected..."
            />
            <p className="text-xs text-muted mt-1">This will be sent to the parent via email.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Admin Notes (Optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg resize-y min-h-[60px]"
              placeholder="Internal notes for admin reference..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
