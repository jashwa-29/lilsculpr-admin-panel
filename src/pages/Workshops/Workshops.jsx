import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SearchBar, Button, Modal, StatusPill, Table } from '../../components/common';
import {
  fetchWorkshopRegistrations,
  fetchWorkshopStats,
  fetchWorkshopDetail,
  expireWorkshopRegistration,
  clearSelectedRegistration
} from '../../store/slices/workshopSlice';

const statusVariant = (status, paymentStatus) => {
  if (status === 'registered' && paymentStatus === 'paid') return 'green';
  if (status === 'pending_payment') return 'yellow';
  if (status === 'expired') return 'red';
  if (status === 'cancelled') return 'gray';
  return 'gray';
};

const statusLabel = (status, paymentStatus) => {
  if (status === 'registered' && paymentStatus === 'paid') return 'Paid';
  if (status === 'pending_payment') return 'Pending';
  if (status === 'expired') return 'Expired';
  if (status === 'cancelled') return 'Cancelled';
  return status || 'N/A';
};

export const Workshops = () => {
  const dispatch = useDispatch();
  const { registrations, stats, pagination, isLoading, isDetailLoading, selectedRegistration } = useSelector((state) => state.workshops);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterCarnival, setFilterCarnival] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExpireConfirm, setShowExpireConfirm] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchWorkshopRegistrations({
      page: currentPage,
      limit: 50,
      carnival: filterCarnival,
      status: filterStatus,
      payment_status: filterPayment,
      search: searchQuery
    }));
  }, [dispatch, currentPage, filterCarnival, filterStatus, filterPayment, searchQuery]);

  useEffect(() => {
    dispatch(fetchWorkshopStats());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewDetail = async (regId) => {
    await dispatch(fetchWorkshopDetail(regId));
    setShowDetailModal(true);
  };

  const handleExpire = async () => {
    if (!selectedRegistration) return;
    await dispatch(expireWorkshopRegistration({
      registrationId: selectedRegistration.registrationId,
      reason: 'Manually removed by admin'
    }));
    setShowExpireConfirm(false);
    setShowDetailModal(false);
    dispatch(clearSelectedRegistration());
    dispatch(fetchWorkshopStats());
    loadData();
  };

  const carnivals = (stats.carnivalStatistics || []).map(c => c._id).filter(Boolean);

  const columns = [
    { key: 'id', title: 'Reg ID' },
    { key: 'child', title: 'Child' },
    { key: 'parent', title: 'Parent' },
    { key: 'contact', title: 'Contact' },
    { key: 'workshop', title: 'Workshop' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Status' },
    { key: 'action', title: 'Action' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-extrabold">Workshop Registrations</h3>
        <Button variant="primary" onClick={loadData}>
          🔄 Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Total</div>
          <div className="font-nunito text-2xl font-black mt-1">{stats.summary.totalRegistrations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Paid</div>
          <div className="font-nunito text-2xl font-black text-green-600 mt-1">{stats.summary.paidRegistrations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Pending</div>
          <div className="font-nunito text-2xl font-black text-yellow-600 mt-1">{stats.summary.pendingRegistrations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Expired</div>
          <div className="font-nunito text-2xl font-black text-red-600 mt-1">{stats.summary.expiredRegistrations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Revenue</div>
          <div className="font-nunito text-lg font-black text-primary mt-1">₹{stats.summary.totalRevenue?.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Success</div>
          <div className="font-nunito text-2xl font-black text-indigo-600 mt-1">{stats.summary.successRate}</div>
        </div>
      </div>

      {/* Carnival Breakdown */}
      {stats.carnivalStatistics?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.carnivalStatistics.map((c) => (
            <div key={c._id} className="card p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{c._id}</div>
                <div className="text-xs text-muted">
                  {c.paid} paid / {c.pending} pending / {c.expired} expired
                </div>
              </div>
              <div className="text-lg font-black">{c.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search ID, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:border-secondary outline-none"
        >
          <option value="all">All Status</option>
          <option value="registered">Registered</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterPayment}
          onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:border-secondary outline-none"
        >
          <option value="all">All Payment</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        {carnivals.length >= 1 && (
          <select
            value={filterCarnival}
            onChange={(e) => { setFilterCarnival(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:border-secondary outline-none"
          >
            <option value="all">All Workshops</option>
            {carnivals.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="text-sm text-muted font-semibold">
          {pagination.totalItems} registration{pagination.totalItems !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={registrations}
          isLoading={isLoading}
          emptyMessage="No workshop registrations found"
          renderRow={(reg) => (
            <tr key={reg._id || reg.registrationId} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
              <td className="px-4 py-3">
                <div className="font-mono text-xs font-bold text-primary">{reg.registrationId}</div>
                <div className="text-xs text-muted">{new Date(reg.createdAt).toLocaleString('en-IN')}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-sm">{reg.childName}</div>
                <div className="text-xs text-muted">Age: {reg.childAge}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">{reg.parentName}</div>
                <div className="text-xs text-muted">{reg.email}</div>
              </td>
              <td className="px-4 py-3 text-sm">{reg.phone}</td>
              <td className="px-4 py-3 text-sm max-w-[160px]">
                <div className="truncate font-medium" title={reg.carnivalName}>{reg.carnivalName}</div>
                <div className="text-xs text-muted">{reg.batchTime}</div>
              </td>
              <td className="px-4 py-3 text-sm">
                <div>{reg.shortDate || reg.selectedDate}</div>
              </td>
              <td className="px-4 py-3">
                <StatusPill variant={statusVariant(reg.status, reg.payment_status)}>
                  {statusLabel(reg.status, reg.payment_status)}
                </StatusPill>
                {reg.materialType && (
                  <div className="text-xs text-muted mt-1">Materials incl.</div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetail(reg.registrationId)}>
                    View
                  </Button>
                  {(reg.status === 'pending_payment' || reg.status === 'registered') && (
                    <Button size="sm" variant="danger" onClick={() => {
                      dispatch(fetchWorkshopDetail(reg.registrationId));
                      setShowExpireConfirm(true);
                    }}>
                      Expire
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); dispatch(clearSelectedRegistration()); }}
        title="📋 Registration Details"
        subtitle={`ID: ${selectedRegistration?.registrationId}`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {selectedRegistration?.status !== 'expired' && selectedRegistration?.status !== 'cancelled' && (
                <Button variant="danger" onClick={() => setShowExpireConfirm(true)}>
                  🗑️ Expire Registration
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => { setShowDetailModal(false); dispatch(clearSelectedRegistration()); }}>
              Close
            </Button>
          </div>
        }
      >
        {isDetailLoading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : selectedRegistration ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Parent Name</label>
                <p className="font-semibold">{selectedRegistration.parentName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Phone</label>
                <p className="font-semibold">{selectedRegistration.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Email</label>
                <p className="font-semibold">{selectedRegistration.email}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Child Name</label>
                <p className="font-semibold">{selectedRegistration.childName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Child Age</label>
                <p className="font-semibold">{selectedRegistration.childAge}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Status</label>
                <StatusPill variant={statusVariant(selectedRegistration.status, selectedRegistration.payment_status)}>
                  {statusLabel(selectedRegistration.status, selectedRegistration.payment_status)}
                </StatusPill>
              </div>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Workshop</label>
                <p className="font-semibold">{selectedRegistration.carnivalName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Date</label>
                <p className="font-semibold">{selectedRegistration.formattedDate || selectedRegistration.selectedDate}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Time</label>
                <p className="font-semibold">{selectedRegistration.batchTime}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Batch</label>
                <p className="font-semibold text-sm">{selectedRegistration.selectedBatch}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Materials Included</label>
                <p className="font-semibold">{selectedRegistration.materialType ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase">Registered On</label>
                <p className="font-semibold">{new Date(selectedRegistration.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
            {selectedRegistration.payment && (
              <>
                <hr />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase">Payment Amount</label>
                    <p className="font-semibold">₹{(selectedRegistration.payment.amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase">Payment ID</label>
                    <p className="font-semibold font-mono text-sm">{selectedRegistration.payment.razorpay_payment_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase">Order ID</label>
                    <p className="font-semibold font-mono text-sm">{selectedRegistration.payment.razorpay_order_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase">Paid At</label>
                    <p className="font-semibold">{selectedRegistration.payment.created_at ? new Date(selectedRegistration.payment.created_at).toLocaleString('en-IN') : 'N/A'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">No details available</div>
        )}
      </Modal>

      {/* Expire Confirmation Modal */}
      <Modal
        isOpen={showExpireConfirm}
        onClose={() => { setShowExpireConfirm(false); if (!showDetailModal) dispatch(clearSelectedRegistration()); }}
        title="⚠️ Confirm Expire"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowExpireConfirm(false); if (!showDetailModal) dispatch(clearSelectedRegistration()); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleExpire}>
              Yes, Expire
            </Button>
          </div>
        }
      >
        <p className="text-sm">Are you sure you want to expire this registration?</p>
        {selectedRegistration && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm">
            <strong>ID:</strong> {selectedRegistration.registrationId}<br />
            <strong>Child:</strong> {selectedRegistration.childName}<br />
            <strong>Parent:</strong> {selectedRegistration.parentName}
          </div>
        )}
        <p className="text-xs text-muted mt-3">This action cannot be undone. The registration will be marked as expired.</p>
      </Modal>
    </div>
  );
};
