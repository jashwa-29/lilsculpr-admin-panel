import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, StatusPill } from '../../components/common';
import { fetchBatches, createBatch, completeBatch } from '../../store/slices/batchSlice';
import { getBatchDisplayName } from '../../utils/helpers';

export const ManageBatches = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { batches, isLoading } = useSelector((state) => state.batches);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    type: 'offline',
    dayId: 'monfri',
    time: '',
    capacity: 8,
  });

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const handleCompleteBatch = async (batchId) => {
    if (!window.confirm('This will auto-advance all students to the next level. Continue?')) {
      return;
    }
    try {
      await dispatch(completeBatch(batchId)).unwrap();
      alert('Batch completed successfully! Students have been advanced to the next level.');
      dispatch(fetchBatches());
    } catch (error) {
      alert('Failed to complete batch: ' + error.message);
    }
  };

  const handleCreateBatch = async () => {
    try {
      await dispatch(createBatch(newBatch)).unwrap();
      setShowCreateModal(false);
      setNewBatch({ type: 'offline', dayId: 'monfri', time: '', capacity: 8 });
      dispatch(fetchBatches());
      alert('Batch created successfully!');
    } catch (error) {
      alert('Failed to create batch: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      filling: 'blue',
      full: 'yellow',
      completed: 'gray',
      archived: 'gray',
      draft: 'gray'
    };
    return colors[status] || 'gray';
  };

  const getDayLabel = (dayId) => {
    const labels = {
      monfri: 'Mon & Fri',
      tuethu: 'Tue & Thu',
      satsu: 'Sat & Sun'
    };
    return labels[dayId] || dayId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-extrabold">Manage Batches</h3>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create New Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {batches && batches.map((batch) => {
          const typeLabel = batch.type === 'offline' ? '🏫 Offline' : '💻 Online';
          const dayLabel = getDayLabel(batch.dayId);
          
          return (
            <div key={batch._id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">
                    {typeLabel}
                  </h4>
                  <p className="text-sm text-muted">{dayLabel} · {batch.time}</p>
                </div>
                <StatusPill variant={getStatusColor(batch.status)}>
                  {batch.status}
                </StatusPill>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Capacity</span>
                  <span className="font-semibold">{batch.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Enrolled</span>
                  <span className="font-semibold">{batch.enrolledStudents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Seats Left</span>
                  <span className="font-semibold">{batch.capacity - (batch.enrolledStudents?.length || 0)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                {batch.status !== 'completed' && batch.status !== 'archived' && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleCompleteBatch(batch._id)}
                  >
                    ✅ Complete Batch
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/students?batchId=${batch._id}`)}
                >
                  👥 View Students
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Batch"
        subtitle="Add a new batch slot"
        headerGradient="from-secondary to-indigo-600"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateBatch}>
              💾 Create Batch
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={newBatch.type}
              onChange={(e) => setNewBatch({ ...newBatch, type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="offline">🏫 Offline</option>
              <option value="online">💻 Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Day <span className="text-red-500">*</span>
            </label>
            <select
              value={newBatch.dayId}
              onChange={(e) => setNewBatch({ ...newBatch, dayId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="monfri">Monday & Friday</option>
              <option value="tuethu">Tuesday & Thursday</option>
              <option value="satsu">Saturday & Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newBatch.time}
              onChange={(e) => setNewBatch({ ...newBatch, time: e.target.value })}
              placeholder="e.g. 4:00–5:00 PM"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Capacity
            </label>
            <input
              type="number"
              value={newBatch.capacity}
              onChange={(e) => setNewBatch({ ...newBatch, capacity: parseInt(e.target.value) || 8 })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              min="1"
              max="20"
            />
            <p className="text-xs text-muted mt-1">Default: 8 students per batch</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};