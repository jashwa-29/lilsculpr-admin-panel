import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, StatusPill, Modal } from '../../components/common';
import { fetchBatches, updateBatches } from '../../store/slices/batchSlice';
import { fetchStudents } from '../../store/slices/studentSlice';
import { MAX_CAPACITY } from '../../utils/constants';
import { getSlotKey, getSlotCount, getSeatsLeft } from '../../utils/helpers';

export const BatchCapacity = () => {
  const dispatch = useDispatch();
  const { data: batches, isLoading } = useSelector((state) => state.batches);
  const { list: students } = useSelector((state) => state.students);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBatches, setTempBatches] = useState({});
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    dispatch(fetchBatches());
    dispatch(fetchStudents());
  }, [dispatch]);

  useEffect(() => {
    if (batches && Object.keys(batches).length > 0) {
      setTempBatches(JSON.parse(JSON.stringify(batches)));
    }
  }, [batches]);

  const handleEditBatch = (type, dayIdx, field, value) => {
    setTempBatches(prev => {
      const newBatches = JSON.parse(JSON.stringify(prev));
      if (field === 'dayLabel') {
        newBatches[type].days[dayIdx].label = value;
      } else if (field === 'dayId') {
        newBatches[type].days[dayIdx].id = value;
      } else if (field === 'slots') {
        newBatches[type].days[dayIdx].slots = value.split(',').map(s => s.trim()).filter(Boolean);
      }
      return newBatches;
    });
  };

  const handleSaveBatches = async () => {
    try {
      await dispatch(updateBatches(tempBatches)).unwrap();
      setShowEditor(false);
      setIsEditing(false);
      alert('Batches updated successfully!');
    } catch (error) {
      alert('Failed to update batches: ' + error.message);
    }
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-nunito font-extrabold">Batch Capacity</h3>
        <Button variant="primary" onClick={() => setShowEditor(true)}>
          ⚙️ Manage Batches
        </Button>
      </div>

      {Object.entries(batches || {}).map(([type, bt]) => (
        <div key={type} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-nunito font-bold text-lg">
              {type === 'offline' ? '🏫' : '💻'} {bt.label} Batches
            </h4>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Time Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Enrolled</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Seats Left</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Fill Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f3ff]">
                  {bt.days?.map((day) => (
                    day.slots?.map((time) => {
                      const key = getSlotKey(type, day.id, time);
                      const enrolled = getSlotCount(students, key);
                      const left = getSeatsLeft(students, key);
                      const pct = Math.round((enrolled / MAX_CAPACITY) * 100);
                      const cls = left === 0 ? 'bg-red-500' : left <= 2 ? 'bg-yellow-500' : 'bg-green-500';
                      const statusLabel = left === 0 ? 'Full' : left <= 2 ? `${left} seats` : `${left} seats`;
                      const statusVariant = left === 0 ? 'red' : left <= 2 ? 'yellow' : 'green';
                      
                      const studentNames = students
                        .filter(s => s.slotKey === key && s.status !== 'cancelled')
                        .map(s => `${s.childName} (L${s.currentLevel || 1})`)
                        .join(', ');

                      return (
                        <tr key={`${type}-${day.id}-${time}`}>
                          <td className="px-4 py-3 text-sm font-semibold">{day.label}</td>
                          <td className="px-4 py-3 text-sm">⏰ {time}</td>
                          <td className="px-4 py-3 font-bold">{enrolled}</td>
                          <td className="px-4 py-3">{MAX_CAPACITY}</td>
                          <td className="px-4 py-3">
                            <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${cls}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {studentNames ? (
                                <span className="text-xs text-muted">{studentNames}</span>
                              ) : (
                                <span className="text-xs text-muted">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Batch Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title="⚙️ Manage Batches"
        subtitle="Edit the configuration below. Add or remove time slots for each day."
        maxWidth="max-w-4xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveBatches}>💾 Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-6">
          {Object.entries(tempBatches || {}).map(([type, bt]) => (
            <div key={type}>
              <h4 className="font-bold text-primary mb-3">{bt.label} Sessions</h4>
              {bt.days?.map((day, dIdx) => (
                <div key={dIdx} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold w-20">Day Label:</label>
                      <input
                        type="text"
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={day.label}
                        onChange={(e) => handleEditBatch(type, dIdx, 'dayLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold w-10">ID:</label>
                      <input
                        type="text"
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-24"
                        value={day.id}
                        onChange={(e) => handleEditBatch(type, dIdx, 'dayId', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="text-sm font-semibold w-20 pt-2">Time Slots:</label>
                    <textarea
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[60px]"
                      value={day.slots?.join(', ')}
                      onChange={(e) => handleEditBatch(type, dIdx, 'slots', e.target.value)}
                      placeholder="4:00-5:00 PM, 5:00-6:00 PM"
                    />
                  </div>
                  <div className="text-xs text-muted mt-2 ml-[88px]">
                    Separate multiple time slots with commas. Example: 4:00-5:00 PM, 5:00-6:00 PM
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
