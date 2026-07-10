// lilsculpr-admin/src/pages/Overview/BatchSummary.jsx

import React from 'react';
import { StatusPill } from '../../components/common';

export const BatchSummary = ({ batches }) => {
  const getFillColor = (pct) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const batchArray = Array.isArray(batches) ? batches : [];

  // ═══ Helper to get day label ═══
  const getDayLabel = (dayId) => {
    const labels = {
      monfri: 'Mon & Fri',
      tuethu: 'Tue & Thu',
      satsu: 'Sat & Sun'
    };
    return labels[dayId] || dayId;
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Schedule</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Seats Left</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Fill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3ff]">
            {batchArray.length > 0 ? (
              batchArray.map((batch) => {
                const enrolled = batch.enrolledStudents?.length || 0;
                const capacity = batch.capacity || 8;
                const left = capacity - enrolled;
                const pct = Math.round((enrolled / capacity) * 100);

                let statusVariant = 'green';
                let statusLabel = `${left} left`;
                if (left === 0) { statusVariant = 'red'; statusLabel = 'Full'; }
                else if (left <= 2) { statusVariant = 'yellow'; }

                const typeLabel = batch.type === 'offline' ? '🏫 Offline' : '💻 Online';
                const dayLabel = getDayLabel(batch.dayId);

                return (
                  <tr key={batch._id}>
                    <td className="px-4 py-3">
                      <StatusPill variant={batch.type === 'offline' ? 'blue' : 'purple'}>
                        {typeLabel}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-sm">{dayLabel}</td>
                    <td className="px-4 py-3 text-sm">⏰ {batch.time}</td>
                    <td className="px-4 py-3">{capacity}</td>
                    <td className="px-4 py-3">
                      <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getFillColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  No batches available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};