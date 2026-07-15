// File: lilsculpr-admin/src/pages/Attendance/Attendance.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { fetchAttendance, saveAttendance } from '../../store/slices/attendanceSlice';
import { Button, StatusPill } from '../../components/common';

export const Attendance = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list: students, isLoading: studentsLoading } = useSelector((state) => state.students);
  const { batches, isLoading: batchesLoading } = useSelector((state) => state.batches);
  const { dailyRecords: records, isLoading: attendanceLoading } = useSelector((state) => state.attendance);

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [pendingChanges, setPendingChanges] = useState({});
  const [expandedBatches, setExpandedBatches] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // ─── UNSAVED CHANGES WARNING ────────────────────────────────────────
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  // Dispatch custom event when pendingChanges changes (for sidebar communication)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('unsavedChanges', { detail: hasUnsavedChanges }));
  }, [hasUnsavedChanges]);

  // Warn before page reload/unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved attendance changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ─── BLOCK POPSTATE NAVIGATION WITH UNSAVED CHANGES ─────────────────
  useEffect(() => {
    let isBlocked = false;

    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        // If we're already blocked, keep the block
        if (e.state && e.state._blocked) {
          window.history.pushState({ _blocked: true }, '', window.location.href);
          return;
        }

        const confirmLeave = window.confirm(
          'You have unsaved attendance changes.\n\nIf you leave now, your changes will be lost.\n\n• Click "OK" to leave without saving\n• Click "Cancel" to stay and save your changes'
        );
        
        if (confirmLeave) {
          setPendingChanges({});
          // Allow navigation by not blocking
          return;
        } else {
          // Re-push blocked state to keep user on page
          window.history.pushState({ _blocked: true }, '', window.location.href);
        }
      }
    };

    // Push initial blocked state if there are changes
    if (hasUnsavedChanges) {
      window.history.pushState({ _blocked: true }, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges]);

  // ─── DATA LOADING ──────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchBatches());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchAttendance({ startDate: selectedDate, endDate: selectedDate, viewType: 'daily' }));
      setPendingChanges({});
    }
  }, [selectedDate, dispatch]);

  // ─── HELPER FUNCTIONS ──────────────────────────────────────────────
  const isBatchActiveOnDate = (batch, dateStr) => {
    if (!batch) return false;
    // Create date in local timezone correctly instead of relying on UTC string parsing which might shift
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ...
    const dayMap = {
      'monfri': [1, 5],
      'tuethu': [2, 4],
      'satsu':  [0, 6]
    };
    
    const validDays = dayMap[batch.dayId] || [];
    
    if (validDays.length > 0) {
      return validDays.includes(dayOfWeek);
    }
    
    // Fallback for batches without a valid dayId mapping
    return true;
  };

  const groupedStudents = useMemo(() => {
    // Include both active and paused students (matches Monthly Attendance behavior)
    const activeStudents = students.filter(s => s.status === 'active' || s.status === 'paused');
    const grouped = {};

    activeStudents.forEach(student => {
      // Handle both populated batchId objects and plain ObjectId strings
      const rawBatchId = student.batchId?._id || student.batchId;
      const batchId = rawBatchId || 'unassigned';
      
      // Only filter by date for students with a recognized batch
      if (batchId !== 'unassigned') {
        const batch = batches.find(b => String(b._id) === String(batchId));
        if (batch && !isBatchActiveOnDate(batch, selectedDate)) {
          return; // Skip students whose batch doesn't run on the selected date
        }
      }
      // Unassigned students are always shown
      
      if (!grouped[batchId]) {
        grouped[batchId] = [];
      }
      grouped[batchId].push(student);
    });

    Object.keys(grouped).forEach(batchId => {
      grouped[batchId].sort((a, b) => a.childName?.localeCompare(b.childName) || 0);
    });

    return grouped;
  }, [students, batches, selectedDate]);

  const getBatchDetails = (batchId) => {
    if (batchId === 'unassigned') {
      return { type: 'unknown', dayId: 'unknown', time: 'Unassigned', label: 'Unassigned Students' };
    }
    const batch = batches.find(b => b._id === batchId);
    if (!batch) return null;
    return batch;
  };

  const getStudentStatus = (studentId) => {
    if (pendingChanges[studentId] !== undefined) {
      return pendingChanges[studentId];
    }
    const record = records.find(r =>
      String(r.studentId) === String(studentId) && r.date === selectedDate
    );
    return record ? record.status : 'none';
  };

  const toggleStudentStatus = (studentId) => {
    const current = getStudentStatus(studentId);
    const next = current === 'none' ? 'P' : current === 'P' ? 'A' : 'none';
    setPendingChanges(prev => ({ ...prev, [studentId]: next }));
  };

  const bulkSetStatus = (batchId, status) => {
    const studentsInBatch = groupedStudents[batchId] || [];
    const newChanges = { ...pendingChanges };

    studentsInBatch.forEach(student => {
      const sid = student._id || student.id;
      newChanges[sid] = status;
    });

    setPendingChanges(newChanges);
  };

  const toggleBatchExpansion = (batchId) => {
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };

  const hasBatchPendingChanges = (batchId) => {
    const studentsInBatch = groupedStudents[batchId] || [];
    return studentsInBatch.some(student => {
      const sid = student._id || student.id;
      return pendingChanges[sid] !== undefined;
    });
  };

  const getBatchStats = (batchId) => {
    const studentsInBatch = groupedStudents[batchId] || [];
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    studentsInBatch.forEach(student => {
      const sid = student._id || student.id;
      const status = getStudentStatus(sid);
      if (status === 'P') present++;
      else if (status === 'A') absent++;
      else notMarked++;
    });

    return { present, absent, notMarked, total: studentsInBatch.length };
  };

  // ─── SAVE FUNCTION ──────────────────────────────────────────────────
  const handleSave = async () => {
    const changesArray = Object.entries(pendingChanges).map(([studentId, status]) => ({
      studentId: studentId,
      date: selectedDate,
      status: status
    }));

    if (changesArray.length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(saveAttendance(changesArray)).unwrap();
      setPendingChanges({});
      dispatch(fetchAttendance({ startDate: selectedDate, endDate: selectedDate, viewType: 'daily' }));
      alert('✅ Attendance saved successfully!');
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert('❌ Error saving attendance: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const clearPendingChanges = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    if (window.confirm('Clear all unsaved changes?')) {
      setPendingChanges({});
    }
  };

  const isLoading = studentsLoading || batchesLoading || attendanceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const batchIds = Object.keys(groupedStudents).filter(id => groupedStudents[id].length > 0);
  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ═══ UNSAVED CHANGES BANNER ═══ */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm animate-pulse">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700 font-semibold">
                ⚠️ You have <span className="font-bold">{Object.keys(pendingChanges).length}</span> unsaved attendance change(s).
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Please click <strong>"Save Changes"</strong> to save your work. Your changes will be lost if you leave this page.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex gap-2">
              <button
                onClick={clearPendingChanges}
                className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg font-semibold transition-colors"
              >
                Discard All
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : '💾 Save Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-nunito text-xl font-extrabold mb-1">📋 Attendance Tracking</h3>
          <p className="text-sm text-muted">
            Tap on a student's status to toggle Present/Absent. Use bulk actions for quick marking.
          </p>
          {hasChanges && (
            <p className="text-sm text-yellow-600 mt-1 font-semibold">
              ⚠️ You have unsaved changes. Click "Save Changes" to confirm.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (hasChanges) {
                const confirmChange = window.confirm(
                  '⚠️ You have unsaved changes. Changing the date will clear them. Continue?'
                );
                if (!confirmChange) return;
              }
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              setSelectedDate(todayStr);
            }}
          >
            📅 Today
          </Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (hasChanges) {
                const confirmChange = window.confirm(
                  '⚠️ You have unsaved changes. Changing the date will clear them. Continue?'
                );
                if (!confirmChange) return;
              }
              setSelectedDate(e.target.value);
            }}
            className="px-3 py-2 border-2 border-border rounded-xl text-sm font-semibold focus:border-secondary outline-none transition-colors"
          />
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearPendingChanges}
              className="text-red-500 border-red-300 hover:border-red-500"
            >
              Clear Changes
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSaving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              '💾 Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* ═══ LEGEND ═══ */}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <span className="font-semibold">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
          Present
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
          Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-gray-300" />
          Not Marked
        </span>
        <span className="text-muted text-xs ml-4">
          {hasChanges ? (
            <span className="text-yellow-600 font-semibold">
              {Object.keys(pendingChanges).length} pending change(s)
            </span>
          ) : (
            <span>No pending changes</span>
          )}
        </span>
      </div>

      {/* ═══ TODAY'S BATCHES SUMMARY ═══ */}
      {(() => {
        const todaysBatches = batches.filter(b => isBatchActiveOnDate(b, selectedDate) && b.status !== 'archived');
        const [year, month, day] = selectedDate.split('-');
        const dateObj = new Date(year, month - 1, day);
        const dateDisplay = dateObj.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        });

        return (
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-blue-800">
                📅 Classes on {dateDisplay}:
              </span>
              {todaysBatches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {todaysBatches.map(b => (
                    <span key={b._id} className="bg-white px-3 py-1 rounded-full text-sm border border-blue-200 shadow-sm text-blue-700 font-semibold">
                      {b.dayId === 'monfri' ? 'Mon & Fri' : b.dayId === 'tuethu' ? 'Tue & Thu' : 'Sat & Sun'} · {b.time}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 font-semibold">No classes scheduled today</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ BATCH CARDS ═══ */}
      {batchIds.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-600">No Classes Today</h3>
          <p className="text-gray-400 mt-2">
            {new Date(...(selectedDate.split('-').map((v, i) => i === 1 ? v - 1 : v))).toLocaleDateString('en-IN', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })} is not a class day.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Select a different date or check the monthly view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {batchIds.map((batchId) => {
            const batch = getBatchDetails(batchId);
            const studentsInBatch = groupedStudents[batchId] || [];
            const stats = getBatchStats(batchId);
            const isExpanded = expandedBatches[batchId] !== false;
            const hasPending = hasBatchPendingChanges(batchId);

            if (!batch) return null;

            const marked = stats.present + stats.absent;
            const pct = marked > 0 ? Math.round((stats.present / marked) * 100) : 0;
            const allMarked = stats.notMarked === 0;

            const batchTypeLabel = batch.type === 'offline' ? '🏫 Offline' : '💻 Online';
            const dayLabel = batch.dayId === 'monfri' ? 'Mon & Fri' :
                           batch.dayId === 'tuethu' ? 'Tue & Thu' :
                           batch.dayId === 'satsu' ? 'Sat & Sun' : batch.dayId;

            return (
              <div
                key={batchId}
                className={`card overflow-hidden border-l-4 ${
                  hasPending ? 'border-yellow-400' : 'border-transparent'
                } transition-all duration-200`}
              >
                {/* Batch Header */}
                <div
                  className="p-5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer flex items-center justify-between flex-wrap gap-3"
                  onClick={() => toggleBatchExpansion(batchId)}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-gray-600 transition-transform">
                      <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-nunito font-bold text-lg">
                          ⏰ {batch.time || 'Unknown Time'}
                        </h4>
                        {(() => {
                          const fillStatus = batch.enrolledStudents?.length >= batch.capacity ? 'Full' : 
                                             batch.enrolledStudents?.length >= batch.capacity - 3 ? 'Filling' : 'Available';
                          return (
                            <StatusPill variant={fillStatus === 'Full' ? 'red' : fillStatus === 'Filling' ? 'yellow' : 'green'} className="text-[10px]">
                              {fillStatus}
                            </StatusPill>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted mt-0.5">
                        <span>{batchTypeLabel}</span>
                        <span>•</span>
                        <span>{dayLabel}</span>
                        <span>•</span>
                        <span>{studentsInBatch.length} student(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                        {stats.present}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                        {stats.absent}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                        {stats.notMarked}
                      </span>
                      {marked > 0 && (
                        <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      )}
                    </div>

                    {hasPending && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                        ⚡ Unsaved
                      </span>
                    )}

                    {allMarked && !hasPending && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Content */}
                {isExpanded && (
                  <div className="p-5 pt-3">
                    {/* Bulk Actions */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-2">
                        Bulk Actions:
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => bulkSetStatus(batchId, 'P')}
                        className="text-xs bg-green-500 hover:bg-green-600 border-green-500"
                      >
                        ✅ All Present
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => bulkSetStatus(batchId, 'A')}
                        className="text-xs"
                      >
                        ❌ All Absent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulkSetStatus(batchId, 'none')}
                        className="text-xs"
                      >
                        ↺ Reset All
                      </Button>
                      <span className="text-xs text-muted ml-2">
                        (Click individual students below to toggle)
                      </span>
                    </div>

                    {/* Student Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {studentsInBatch.map((student) => {
                        const sid = student._id || student.id;
                        const status = getStudentStatus(sid);
                        const isPending = pendingChanges[sid] !== undefined;

                        let statusClass = "bg-gray-100 text-gray-400 border-gray-200 hover:border-gray-300";
                        let statusLabel = "Not Marked";
                        let statusEmoji = "⭕";

                        if (status === 'P') {
                          statusClass = "bg-green-500 text-white shadow-lg shadow-green-500/20 border-green-600";
                          statusLabel = "Present";
                          statusEmoji = "✅";
                        } else if (status === 'A') {
                          statusClass = "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-600";
                          statusLabel = "Absent";
                          statusEmoji = "❌";
                        }

                        return (
                          <div
                            key={sid}
                            onClick={() => toggleStudentStatus(sid)}
                            className={`
                              relative p-4 rounded-xl border-2 cursor-pointer
                              transition-all duration-200 hover:scale-105 active:scale-95
                              ${statusClass}
                              ${isPending ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                            `}
                            title={`${student.childName} - ${statusLabel}${isPending ? ' (Unsaved)' : ''}`}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2
                                ${status === 'P' ? 'bg-white/20' : status === 'A' ? 'bg-white/20' : 'bg-gray-200'}
                              `}>
                                {student.childName?.[0]?.toUpperCase() || '?'}
                              </div>

                              <div className="font-semibold text-sm leading-tight">
                                {student.childName}
                              </div>

                              <div className="text-xs opacity-75 mt-1">
                                L{student.currentLevel || 1}
                              </div>

                              <div className={`
                                mt-2 px-2 py-0.5 rounded-full text-xs font-bold
                                ${status === 'P' ? 'bg-white/20' : status === 'A' ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}
                              `}>
                                {statusEmoji} {statusLabel}
                              </div>

                              {isPending && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Student Name List */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs text-muted flex flex-wrap gap-2">
                        <span className="font-semibold">Students:</span>
                        {studentsInBatch.map((student, idx) => {
                          const sid = student._id || student.id;
                          const status = getStudentStatus(sid);
                          const statusDot = status === 'P' ? '🟢' : status === 'A' ? '🔴' : '⚪';
                          return (
                            <span key={sid} className="inline-flex items-center gap-1">
                              {statusDot} {student.childName}
                              {idx < studentsInBatch.length - 1 && ','}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ SUMMARY FOOTER ═══ */}
      {batchIds.length > 0 && (
        <div className="card p-4 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="font-semibold">Summary:</span>
              <span className="ml-2">
                {batchIds.length} batch(es) ·
                {Object.values(groupedStudents).reduce((acc, s) => acc + s.length, 0)} students
              </span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                {Object.values(groupedStudents).reduce((acc, students) => {
                  return acc + students.filter(s => getStudentStatus(s._id || s.id) === 'P').length;
                }, 0)} Present
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                {Object.values(groupedStudents).reduce((acc, students) => {
                  return acc + students.filter(s => getStudentStatus(s._id || s.id) === 'A').length;
                }, 0)} Absent
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                {Object.values(groupedStudents).reduce((acc, students) => {
                  return acc + students.filter(s => getStudentStatus(s._id || s.id) === 'none').length;
                }, 0)} Not Marked
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;