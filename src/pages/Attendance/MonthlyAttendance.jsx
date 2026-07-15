// File: lilsculpr-admin/src/pages/Attendance/MonthlyAttendance.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { fetchAttendance, saveAttendance } from '../../store/slices/attendanceSlice';
import { fetchCompensationsAdmin } from '../../store/slices/compensationSlice';
import { Button, StatusPill } from '../../components/common';

// Helper: Get the day of week for a given date
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  return date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
};

// Helper: Check if a date is on a specific day of week
const isDayOfWeek = (dateStr, dayId) => {
  const day = getDayOfWeek(dateStr);
  if (dayId === 'monfri') return day === 1 || day === 5;
  if (dayId === 'tuethu') return day === 2 || day === 4;
  if (dayId === 'satsu') return day === 6 || day === 0;
  // Fallback for batches without a recognized dayId mapping
  return true;
};

export const MonthlyAttendance = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list: students, isLoading: studentsLoading } = useSelector((state) => state.students);
  const { batches, isLoading: batchesLoading } = useSelector((state) => state.batches);
  const { monthlyRecords: records, isLoading: attendanceLoading } = useSelector((state) => state.attendance);
  const { records: compensations } = useSelector((state) => state.compensations);

  // State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedBatch, setSelectedBatch] = useState('all'); // 'all' or batchId
  const [pendingChanges, setPendingChanges] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load data
  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchBatches());
  }, [dispatch]);

  // Load attendance and compensations for the selected month
  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const params = { startDate, endDate, viewType: 'monthly' };
      if (selectedBatch !== 'all') {
        params.batchId = selectedBatch;
      }
      
      dispatch(fetchAttendance(params));
      dispatch(fetchCompensationsAdmin({ startDate, endDate }));
      setPendingChanges({});
    }
  }, [selectedMonth, selectedBatch, dispatch]);

  // ─── UNSAVED CHANGES WARNING ────────────────────────────────────────
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('unsavedChanges', { detail: hasUnsavedChanges }));
  }, [hasUnsavedChanges]);

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

  useEffect(() => {
    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        if (e.state && e.state._blocked) {
          window.history.pushState({ _blocked: true }, '', window.location.href);
          return;
        }

        const confirmLeave = window.confirm(
          'You have unsaved attendance changes.\n\nIf you leave now, your changes will be lost.\n\n• Click "OK" to leave without saving\n• Click "Cancel" to stay and save your changes'
        );
        
        if (confirmLeave) {
          setPendingChanges({});
        } else {
          window.history.pushState({ _blocked: true }, '', window.location.href);
        }
      }
    };

    if (hasUnsavedChanges) {
      window.history.pushState({ _blocked: true }, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges]);

  // ─── SAVE FUNCTION ──────────────────────────────────────────────────
  const handleSave = async () => {
    const changesArray = Object.entries(pendingChanges).map(([key, status]) => {
      const [studentId, date] = key.split('|');
      return { studentId, date, status };
    });

    if (changesArray.length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(saveAttendance(changesArray)).unwrap();
      setPendingChanges({});
      // Refresh attendance
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      dispatch(fetchAttendance({ startDate, endDate, viewType: 'monthly' }));
      dispatch(fetchCompensationsAdmin({ startDate, endDate }));
      alert('✅ Attendance saved successfully!');
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert('❌ Error saving attendance: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const clearPending = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    if (window.confirm('Clear all unsaved changes?')) {
      setPendingChanges({});
    }
  };

  // ─── FILTERED STUDENTS ─────────────────────────────────────────────
  // Only show students from the selected batch
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => s.status === 'active' || s.status === 'paused');
    
    // Handle both populated batchId objects and plain ObjectId strings
    if (selectedBatch !== 'all') {
      result = result.filter(s => {
        const studentBatchId = s.batchId?._id || s.batchId;
        return String(studentBatchId) === String(selectedBatch);
      });
    }
    
    result.sort((a, b) => {
      const aBatch = String(a.batchId?._id || a.batchId || '');
      const bBatch = String(b.batchId?._id || b.batchId || '');
      if (aBatch !== bBatch) {
        return aBatch.localeCompare(bBatch);
      }
      return (a.childName || '').localeCompare(b.childName || '');
    });
    
    return result;
  }, [students, selectedBatch]);

  // ─── HELPER FUNCTIONS ──────────────────────────────────────────────
  const getStudentBatch = (studentId) => {
    const student = students.find(s => {
      const sid = s._id || s.id;
      return String(sid) === String(studentId);
    });
    if (!student) return null;

    // If batchId is already a populated object, return it directly
    if (student.batchId && typeof student.batchId === 'object' && student.batchId._id) {
      return student.batchId;
    }
    // Otherwise look it up in the batches list
    return batches.find(b => String(b._id) === String(student.batchId));
  };

  const getStudentDayId = (studentId) => {
    const batch = getStudentBatch(studentId);
    return batch ? batch.dayId : null;
  };

  // ─── UPDATED: Get relevant days including compensation days ──────
  const getRelevantDays = (studentId) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days = [];
    const lastDay = new Date(year, month, 0).getDate();
    const regularDayId = getStudentDayId(studentId);

    // If a specific batch is selected, only show days for that batch
    if (selectedBatch !== 'all') {
      const studentBatch = getStudentBatch(studentId);
      if (studentBatch && String(studentBatch._id) === String(selectedBatch)) {
        if (regularDayId) {
          for (let i = 1; i <= lastDay; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (isDayOfWeek(dateStr, regularDayId)) {
              days.push({
                day: i,
                date: dateStr,
                dayOfWeek: getDayOfWeek(dateStr),
                isCompensation: false,
              });
            }
          }
        }
      }
      return days;
    }

    // 1. Add regular batch days (for all batches)
    if (regularDayId) {
      for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (isDayOfWeek(dateStr, regularDayId)) {
          days.push({
            day: i,
            date: dateStr,
            dayOfWeek: getDayOfWeek(dateStr),
            isCompensation: false,
          });
        }
      }
    }

    // 2. Add compensation days
    const studentCompensations = compensations.filter(c =>
      String(c.studentId) === String(studentId) && c.status !== 'Missed'
    );
    studentCompensations.forEach(comp => {
      const compDate = comp.date;
      // Check if this date is already in the days array (to avoid duplicates)
      const exists = days.some(d => d.date === compDate);
      if (!exists) {
        const dateObj = new Date(compDate);
        days.push({
          day: dateObj.getDate(),
          date: compDate,
          dayOfWeek: dateObj.getDay(),
          isCompensation: true,
          compensationId: comp._id,
          compensationStatus: comp.status,
        });
      }
    });

    // Sort by date
    days.sort((a, b) => a.date.localeCompare(b.date));
    return days;
  };

  // ─── UPDATED: Get attendance status with compensation priority ──
  const getAttendanceStatus = (studentId, date) => {
    // 1. Check if this is a compensation day
    const comp = compensations.find(c =>
      String(c.studentId) === String(studentId) && c.date === date
    );

    // 2. If it's a compensation, use the compensation's status
    if (comp) {
      // Map compensation statuses to attendance statuses
      // Attended -> 'P' (Present), Booked -> 'P' (Present), Missed -> 'A' (Absent)
      if (comp.status === 'Attended') return 'P';
      if (comp.status === 'Booked') return 'P'; // Booked is treated as Present
      if (comp.status === 'Missed') return 'A';
      // If there's a pending change for this compensation day, override
      if (pendingChanges[`${studentId}|${date}`] !== undefined) {
        return pendingChanges[`${studentId}|${date}`];
      }
      return 'none';
    }

    // 3. If not a compensation, check pending changes or regular attendance
    if (pendingChanges[`${studentId}|${date}`] !== undefined) {
      return pendingChanges[`${studentId}|${date}`];
    }
    const record = records.find(r =>
      String(r.studentId) === String(studentId) && r.date === date
    );
    return record ? record.status : 'none';
  };

  // ─── UPDATED: Toggle attendance with compensation prevention ────
  const toggleAttendance = (studentId, date) => {
    // Prevent toggling if it's a compensation day
    const isCompensation = compensations.some(c =>
      String(c.studentId) === String(studentId) && c.date === date
    );
    if (isCompensation) {
      alert('This is a compensation class. Please use the Compensations tab to update its status.');
      return;
    }

    // Otherwise, proceed with the normal toggle
    const current = getAttendanceStatus(studentId, date);
    const next = current === 'none' ? 'P' : current === 'P' ? 'A' : 'none';
    setPendingChanges(prev => ({ ...prev, [`${studentId}|${date}`]: next }));
  };

  const bulkSetStudentAttendance = (studentId, status) => {
    const newChanges = { ...pendingChanges };
    const days = getRelevantDays(studentId);
    days.forEach(day => {
      // Skip compensation days
      if (day.isCompensation) return;
      const key = `${studentId}|${day.date}`;
      newChanges[key] = status;
    });
    setPendingChanges(newChanges);
  };

  const bulkSetDateAttendance = (date, status) => {
    const newChanges = { ...pendingChanges };
    filteredStudents.forEach(student => {
      const sid = student._id || student.id;
      const dayId = getStudentDayId(sid);
      if (dayId && isDayOfWeek(date, dayId)) {
        // Check if it's a compensation day for this student
        const isCompensation = compensations.some(c =>
          String(c.studentId) === String(sid) && c.date === date
        );
        if (!isCompensation) {
          const key = `${sid}|${date}`;
          newChanges[key] = status;
        }
      }
    });
    setPendingChanges(newChanges);
  };

  const getStudentStats = (studentId) => {
    const days = getRelevantDays(studentId);
    let present = 0;
    let absent = 0;
    let notMarked = 0;
    const total = days.length;

    days.forEach(day => {
      const status = getAttendanceStatus(studentId, day.date);
      if (status === 'P') present++;
      else if (status === 'A') absent++;
      else notMarked++;
    });

    const marked = present + absent;
    const attendancePercentage = marked > 0 ? Math.round((present / marked) * 100) : 0;

    return { present, absent, notMarked, total, attendancePercentage };
  };

  const getDateStats = (date) => {
    let present = 0;
    let absent = 0;
    let notMarked = 0;
    let relevantCount = 0;

    filteredStudents.forEach(student => {
      const sid = student._id || student.id;
      const dayId = getStudentDayId(sid);
      if (dayId && isDayOfWeek(date, dayId)) {
        relevantCount++;
        const status = getAttendanceStatus(sid, date);
        if (status === 'P') present++;
        else if (status === 'A') absent++;
        else notMarked++;
      }
    });

    return { present, absent, notMarked, total: relevantCount };
  };

  // ─── GET MONTH NAME ─────────────────────────────────────────────────
  const monthName = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // ─── GET ALL UNIQUE DATES ──────────────────────────────────────────
  const allDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days = [];
    const lastDay = new Date(year, month, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        dayOfWeek: getDayOfWeek(dateStr),
      });
    }
    return days;
  }, [selectedMonth]);

  const isDateRelevantForFilter = (dateStr) => {
    const day = getDayOfWeek(dateStr);
    if (selectedBatch === 'all') {
      return filteredStudents.some(s => {
        const dayId = getStudentDayId(s._id || s.id);
        return dayId && isDayOfWeek(dateStr, dayId);
      });
    }
    const batch = batches.find(b => b._id === selectedBatch);
    if (!batch) return false;
    return isDayOfWeek(dateStr, batch.dayId);
  };

  const relevantDates = allDays.filter(day => isDateRelevantForFilter(day.date));

  // ─── LOADING STATE ──────────────────────────────────────────────────
  if (studentsLoading || batchesLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading attendance data...</p>
        </div>
      </div>
    );
  }

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
                onClick={clearPending}
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
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-nunito text-xl font-extrabold mb-1">
              📋 Monthly Attendance Register
            </h3>
            <p className="text-sm text-muted">
              Shows regular class days and compensation classes.
              {hasChanges && (
                <span className="text-yellow-600 font-semibold ml-2">
                  ⚠️ {Object.keys(pendingChanges).length} pending change(s)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (hasChanges) {
                  const confirmChange = window.confirm(
                    '⚠️ You have unsaved changes. Changing the month will clear them. Continue?'
                  );
                  if (!confirmChange) return;
                }
                setSelectedMonth(e.target.value);
              }}
              className="px-3 py-2 border-2 border-border rounded-xl text-sm font-semibold focus:border-secondary outline-none transition-colors"
            />
            
            {/* Batch filter - shows only students from selected batch */}
            <select
              value={selectedBatch}
              onChange={(e) => {
                if (hasChanges) {
                  const confirmChange = window.confirm(
                    '⚠️ You have unsaved changes. Switching batches will clear them. Continue?'
                  );
                  if (!confirmChange) return;
                }
                setSelectedBatch(e.target.value);
                setPendingChanges({});
              }}
              className="px-3 py-2 border-2 border-border rounded-xl text-sm font-semibold focus:border-secondary outline-none transition-colors min-w-[180px]"
            >
              <option value="all">📚 All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.type === 'offline' ? '🏫' : '💻'} {b.dayId} {b.time}
                  {' ('}{(b.enrolledStudents?.length || 0)} students{')'}
                </option>
              ))}
            </select>

            {hasChanges && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearPending}
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

        {/* Legend - Updated to show compensation info */}
        <div className="flex flex-wrap gap-4 items-center text-sm mt-4 pt-4 border-t border-border">
          <span className="font-semibold">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
            Present (P)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
            Absent (A)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-gray-300" />
            Not Marked (-)
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-100 border border-blue-300" />
            <span className="font-semibold">Compensation Class</span>
          </span>
          <span className="text-muted text-xs ml-2">
            {selectedBatch !== 'all' ? (
              <span className="font-semibold text-blue-600">
                {filteredStudents.length} student(s) in selected batch · {relevantDates.length} class days
              </span>
            ) : (
              <span>
                {filteredStudents.length} student(s) · {relevantDates.length} class days
              </span>
            )}
          </span>
          {selectedBatch !== 'all' && (
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              📌 {batches.find(b => b._id === selectedBatch)?.dayId} {batches.find(b => b._id === selectedBatch)?.time}
            </span>
          )}
        </div>
      </div>

      {/* ═══ BATCH SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wider">Total Present</div>
          <div className="font-nunito text-2xl font-black text-green-700 mt-1">
            {filteredStudents.reduce((sum, s) => {
              const stats = getStudentStats(s._id || s.id);
              return sum + stats.present;
            }, 0)}
          </div>
        </div>
        <div className="card p-4 bg-red-50 border-red-200">
          <div className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Absent</div>
          <div className="font-nunito text-2xl font-black text-red-700 mt-1">
            {filteredStudents.reduce((sum, s) => {
              const stats = getStudentStats(s._id || s.id);
              return sum + stats.absent;
            }, 0)}
          </div>
        </div>
        <div className="card p-4 bg-gray-50 border-gray-200">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Not Marked</div>
          <div className="font-nunito text-2xl font-black text-gray-600 mt-1">
            {filteredStudents.reduce((sum, s) => {
              const stats = getStudentStats(s._id || s.id);
              return sum + stats.notMarked;
            }, 0)}
          </div>
        </div>
      </div>

      {/* ═══ CLASS DAY SUMMARY ═══ */}
      <div className="card p-4 overflow-x-auto">
        <h4 className="font-nunito font-bold mb-3 flex items-center gap-2">
          📅 Class Day Summary
          <span className="text-xs font-normal text-muted">
            ({relevantDates.length} class days this month)
          </span>
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {relevantDates.map(day => {
            const stats = getDateStats(day.date);
            const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
            return (
              <div 
                key={day.date}
                className="flex-shrink-0 w-14 text-center p-2 rounded-lg border bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <div className="text-xs font-bold text-blue-700">{day.day}</div>
                <div className="text-[10px] text-muted">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.dayOfWeek]}
                </div>
                <div className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {pct}%
                </div>
                <div className="flex justify-center gap-0.5 mt-1 text-xs">
                  <span className="text-green-600">{stats.present}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-red-600">{stats.absent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ MAIN ATTENDANCE TABLE ═══ */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="px-2 py-2 text-left font-bold text-xs uppercase tracking-wider text-muted border-b border-border sticky left-0 bg-gray-100 z-20 min-w-[150px]">
                  Student / Batch
                </th>
                {relevantDates.map(day => (
                  <th 
                    key={day.date}
                    className="px-1 py-2 text-center font-bold text-xs border-b border-border min-w-[32px] bg-blue-50"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-blue-700">{day.day}</span>
                      <span className="text-[10px] font-normal text-muted">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.dayOfWeek]}
                      </span>
                      <div className="flex gap-0.5 mt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Mark all students as Present for ${day.day}?`)) {
                              bulkSetDateAttendance(day.date, 'P');
                            }
                          }}
                          className="text-[8px] text-blue-500 hover:text-blue-700 px-0.5"
                          title="Mark all Present for this date"
                        >
                          P
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Mark all students as Absent for ${day.day}?`)) {
                              bulkSetDateAttendance(day.date, 'A');
                            }
                          }}
                          className="text-[8px] text-red-500 hover:text-red-700 px-0.5"
                          title="Mark all Absent for this date"
                        >
                          A
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-bold text-xs uppercase tracking-wider text-muted border-b border-border min-w-[60px]">
                  Present
                </th>
                <th className="px-2 py-2 text-center font-bold text-xs uppercase tracking-wider text-muted border-b border-border min-w-[60px]">
                  Absent
                </th>
                <th className="px-2 py-2 text-center font-bold text-xs uppercase tracking-wider text-muted border-b border-border min-w-[70px]">
                  %
                </th>
                <th className="px-2 py-2 text-center font-bold text-xs uppercase tracking-wider text-muted border-b border-border min-w-[80px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={relevantDates.length + 5} className="text-center py-10 text-muted">
                    {selectedBatch !== 'all' ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📭</span>
                        <span>No students found in this batch.</span>
                        <button 
                          onClick={() => setSelectedBatch('all')}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          View all students
                        </button>
                      </div>
                    ) : (
                      'No active students found. Enroll students first.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const sid = student._id || student.id;
                  const stats = getStudentStats(sid);
                  const batch = batches.find(b => b._id === student.batchId);
                  const batchLabel = batch 
                    ? `${batch.type === 'offline' ? '🏫' : '💻'} ${batch.dayId} ${batch.time}`
                    : 'Unassigned';
                  
                  const studentDays = getRelevantDays(sid);

                  return (
                    <tr key={sid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-1.5 sticky left-0 bg-white z-10 border-r border-border">
                        <div className="font-semibold text-sm">{student.childName}</div>
                        <div className="text-xs text-muted flex items-center gap-1">
                          <span>{batchLabel}</span>
                          <StatusPill variant={student.status === 'active' ? 'green' : 'yellow'} className="text-[8px]">
                            {student.status}
                          </StatusPill>
                        </div>
                      </td>

                      {relevantDates.map(day => {
                        const status = getAttendanceStatus(sid, day.date);
                        const isPending = pendingChanges[`${sid}|${day.date}`] !== undefined;
                        const isClassDay = studentDays.some(d => d.date === day.date);
                        const isCompensation = studentDays.some(d => d.date === day.date && d.isCompensation === true);
                        
                        let bgColor = 'bg-gray-100 hover:bg-gray-200';
                        let textColor = 'text-gray-400';
                        let label = '—';
                        
                        if (status === 'P') {
                          bgColor = 'bg-green-500 hover:bg-green-600 text-white';
                          textColor = 'text-white';
                          label = 'P';
                        } else if (status === 'A') {
                          bgColor = 'bg-red-500 hover:bg-red-600 text-white';
                          textColor = 'text-white';
                          label = 'A';
                        }

                        // If it's a compensation day, change the background
                        if (isCompensation && isClassDay) {
                          bgColor = 'bg-blue-200 hover:bg-blue-300';
                          textColor = 'text-blue-800';
                          if (status === 'P') {
                            label = 'P*';
                            bgColor = 'bg-blue-300 hover:bg-blue-400';
                          } else if (status === 'A') {
                            label = 'A*';
                            bgColor = 'bg-blue-200 hover:bg-blue-300';
                          } else {
                            label = 'C'; // 'C' for Compensation booked
                            bgColor = 'bg-blue-100 hover:bg-blue-200';
                          }
                        }

                        if (!isClassDay) {
                          return (
                            <td 
                              key={`${sid}|${day.date}`}
                              className="px-1 py-1.5 text-center bg-gray-50"
                            >
                              <span className="text-xs text-gray-300">—</span>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={`${sid}|${day.date}`}
                            className={`px-1 py-1.5 text-center cursor-pointer transition-colors ${
                              isPending ? 'ring-2 ring-yellow-400 ring-inset' : ''
                            } ${isCompensation ? 'cursor-default' : ''}`}
                            onClick={() => {
                              if (!isCompensation) {
                                toggleAttendance(sid, day.date);
                              }
                            }}
                            title={`${student.childName} - ${day.date}: ${status || 'Not Marked'}${isPending ? ' (Unsaved)' : ''}${isCompensation ? ' (Compensation Class)' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${bgColor} ${textColor} ${isPending ? 'scale-110' : ''} ${isCompensation ? 'border-2 border-blue-400' : ''}`}>
                              {label}
                            </div>
                            {isCompensation && (
                              <div className="text-[8px] text-blue-600 font-semibold">C</div>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-2 py-1.5 text-center font-bold text-green-600">
                        {stats.present}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold text-red-600">
                        {stats.absent}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        <span className={`
                          ${stats.attendancePercentage >= 80 ? 'text-green-600' : 
                            stats.attendancePercentage >= 50 ? 'text-yellow-600' : 
                            stats.attendancePercentage > 0 ? 'text-red-600' : 'text-gray-400'}
                        `}>
                          {stats.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); bulkSetStudentAttendance(sid, 'P'); }}
                            className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="Mark all Present"
                          >
                            All P
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); bulkSetStudentAttendance(sid, 'A'); }}
                            className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Mark all Absent"
                          >
                            All A
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); bulkSetStudentAttendance(sid, 'none'); }}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            title="Reset all"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ FOOTER SUMMARY ═══ */}
      <div className="card p-4 bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span className="font-semibold">Summary for {monthName}:</span>
            <span className="ml-2">
              {filteredStudents.length} students · {relevantDates.length} class days
              {selectedBatch !== 'all' && (
                <span className="ml-2 text-blue-600 font-medium">
                  (Batch: {batches.find(b => b._id === selectedBatch)?.dayId} {batches.find(b => b._id === selectedBatch)?.time})
                </span>
              )}
            </span>
            <span className="ml-2 text-blue-600">
              · {compensations.filter(c => filteredStudents.some(s => String(s._id) === String(c.studentId))).length} compensation(s)
            </span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              {filteredStudents.reduce((sum, s) => sum + getStudentStats(s._id || s.id).present, 0)} Present
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              {filteredStudents.reduce((sum, s) => sum + getStudentStats(s._id || s.id).absent, 0)} Absent
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
              {filteredStudents.reduce((sum, s) => sum + getStudentStats(s._id || s.id).notMarked, 0)} Not Marked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendance;