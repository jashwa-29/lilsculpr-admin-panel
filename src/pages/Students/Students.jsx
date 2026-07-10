// ─── STUDENTS.JSX (UPDATED WITH AUTO-CALCULATED AGE) ──────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { SearchBar, Button, Modal } from '../../components/common';
import { StudentCard } from './StudentCard';
import { StudentModal } from './StudentModal';
import { fetchStudents, createStudent, clearError, startLevelJourney, advanceLevel } from '../../store/slices/studentSlice';
import { fetchBatches } from '../../store/slices/batchSlice';
import { FEES_MONTHLY, KIT_FEE } from '../../utils/constants';
import { getSlotKey, generateId, getBatchShortName, getBatchDisplayName } from '../../utils/helpers';

export const Students = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list: students, isLoading: studentsLoading, error } = useSelector((state) => state.students);
  const { batches, isLoading: batchesLoading } = useSelector((state) => state.batches);
  const isLoading = studentsLoading || batchesLoading;
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // ─── MANUAL ENTRY FORM STATE ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    dateOfBirth: '',
    childClass: '',
    schoolName: '',
    parentName: '',
    email: '',
    contact1: '',
    contact2: '',
    batchId: '',
    kitOptIn: false,
    amountPaid: 0,
    paymentRef: '',
    paymentMethod: 'Cash',
    paymentStatus: 'completed', // 'completed' or 'pending'
    currentLevel: 0,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ─── DOB VALIDATION STATE ─────────────────────────────────────────────
  const [dobError, setDobError] = useState('');
  const [ageAutoCalcMsg, setAgeAutoCalcMsg] = useState('');
  const [isDobValid, setIsDobValid] = useState(false);

  // Get batchId from URL
  const batchIdFilter = searchParams.get('batchId');

  const selectedBatch = useMemo(() => {
    if (!batchIdFilter) return null;
    return batches.find(b => b._id === batchIdFilter);
  }, [batches, batchIdFilter]);

  const clearBatchFilter = () => {
    setSearchParams({});
  };

  // ─── AUTO-OPEN ADD STUDENT MODAL VIA URL PARAM ────────────────────────
  useEffect(() => {
    if (searchParams.get('addStudent') === '1') {
      setShowManualEntry(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('addStudent');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchBatches());
  }, [dispatch, refreshTrigger]);

  useEffect(() => {
    if (error) {
      alert('Error: ' + error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ─── CALCULATE AGE FROM DOB ──────────────────────────────────────────
  const calculateAgeFromDob = (dobValue) => {
    // Reset states
    setDobError('');
    setAgeAutoCalcMsg('');
    setIsDobValid(false);

    if (!dobValue) {
      return false;
    }

    const dob = new Date(dobValue);
    const today = new Date();
    
    if (isNaN(dob.getTime()) || dob > today) {
      setDobError('Please enter a valid date of birth (must be in the past)');
      return false;
    }

    // Calculate age from DOB
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }

    // Check if age is within valid range (3-16)
    if (calculatedAge < 3 || calculatedAge > 16) {
      setDobError(`Child would be ${calculatedAge} years old, but age must be between 3 and 16 years.`);
      return false;
    }

    // ─── AUTO-FILL AGE ──────────────────────────────────────────────────
    setFormData(prev => ({
      ...prev,
      childAge: String(calculatedAge)
    }));

    setAgeAutoCalcMsg(`✅ Age auto-calculated: ${calculatedAge} years`);
    setIsDobValid(true);
    return true;
  };

  // ─── HANDLE FORM FIELD CHANGES ──────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-calculate age when DOB changes
    if (name === 'dateOfBirth') {
      calculateAgeFromDob(value);
    }
  };

  const getFilterOptions = () => {
    const options = [{ id: 'all', label: '📚 All Students' }];
    if (Array.isArray(batches)) {
      batches.forEach((b) => {
        const label = getBatchShortName(b);
        options.push({ id: b._id, label });
      });
    }
    return options;
  };

  const filterStudents = () => {
    let filtered = students;
    
    if (batchIdFilter) {
      filtered = filtered.filter(s => s.batchId === batchIdFilter);
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.batchId === filter);
    }
    
    filtered = filtered.filter(s => s.status !== 'cancelled');
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.childName?.toLowerCase().includes(q) ||
        s.parentName?.toLowerCase().includes(q) ||
        s.contact1?.includes(q) ||
        s.schoolName?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  };

  const handleViewStudent = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleStudentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // ═══ NEW: Start Level Journey ═══
  const handleStartLevelJourney = async (studentId) => {
    if (!window.confirm('This will start the student\'s Level 1 journey. They will move from "Newbie" (Level 0) to Level 1. Continue?')) {
      return;
    }
    
    try {
      const result = await dispatch(startLevelJourney(studentId)).unwrap();
      alert(`✅ ${result.student.childName} has started Level 1!`);
      dispatch(fetchStudents());
    } catch (error) {
      alert('❌ Failed to start level journey: ' + (error.message || 'Unknown error'));
    }
  };

  // ═══ NEW: Advance Level ═══
  const handleAdvanceLevel = async (studentId) => {
    const student = students.find(s => s.id === studentId || s._id === studentId);
    if (!student) return;
    
    const currentLevel = student.currentLevel || 0;
    if (currentLevel === 0) {
      alert('Student has not started their level journey yet. Please start Level 1 first.');
      return;
    }
    
    if (currentLevel >= 12) {
      alert('Student is already at Level 12! They can be marked as graduated.');
      return;
    }
    
    if (!window.confirm(`Advance ${student.childName} from Level ${currentLevel} to Level ${currentLevel + 1}?`)) {
      return;
    }
    
    try {
      const result = await dispatch(advanceLevel(studentId)).unwrap();
      alert(`✅ ${result.student.childName} advanced to Level ${result.student.currentLevel}!`);
      dispatch(fetchStudents());
    } catch (error) {
      alert('❌ Failed to advance level: ' + (error.message || 'Unknown error'));
    }
  };

  // ═══ NEW: Mark as Graduated ═══
  const handleGraduateStudent = async (studentId) => {
    const student = students.find(s => s.id === studentId || s._id === studentId);
    if (!student) return;
    
    if (student.currentLevel !== 12) {
      alert(`Student is at Level ${student.currentLevel}. They need to reach Level 12 before graduating.`);
      return;
    }
    
    if (!window.confirm(`Mark ${student.childName} as graduated? This will complete their level journey.`)) {
      return;
    }
    
    try {
      if (student.currentLevel === 12) {
        const result = await dispatch(advanceLevel(studentId)).unwrap();
        if (result.action === 'graduated') {
          alert(`🎉 ${student.childName} has graduated from the program!`);
          dispatch(fetchStudents());
        }
      }
    } catch (error) {
      alert('❌ Failed to graduate student: ' + (error.message || 'Unknown error'));
    }
  };

  const calculateAmount = () => {
    if (!formData.batchId) return 0;
    const batch = batches.find(b => b._id === formData.batchId);
    if (!batch) return 0;
    const base = batch.type === 'offline' ? FEES_MONTHLY.offline : FEES_MONTHLY.online;
    const kit = formData.kitOptIn ? KIT_FEE : 0;
    return base + kit;
  };

  const handleBatchChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      batchId: value,
    }));
  };

  // ─── SUBMIT HANDLER (UPDATED WITH DOB VALIDATION) ──────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // ─── VALIDATE DOB ──────────────────────────────────────────────────
    if (!formData.dateOfBirth) {
      setFormError('Date of Birth is required.');
      const dobField = document.querySelector('input[name="dateOfBirth"]');
      if (dobField) {
        dobField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dobField.focus();
      }
      setIsSubmitting(false);
      return;
    }

    // Re-calculate age from DOB to ensure it's valid
    const ageValid = calculateAgeFromDob(formData.dateOfBirth);
    if (!ageValid) {
      setFormError('Please fix the Date of Birth before submitting.');
      const dobField = document.querySelector('input[name="dateOfBirth"]');
      if (dobField) {
        dobField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dobField.focus();
      }
      setIsSubmitting(false);
      return;
    }

    const { batchId, childName, parentName, contact1, paymentMethod, paymentStatus, currentLevel } = formData;
    
    if (!batchId) {
      setFormError('Please select a Batch.');
      setIsSubmitting(false);
      return;
    }

    if (!childName || !parentName || !contact1) {
      setFormError('Please fill in Child Name, Parent Name, and Contact 1.');
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionData = new FormData();
      
      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'amountPaid' && key !== 'paymentMethod' && key !== 'paymentStatus') {
          submissionData.append(key, value);
        }
      });
      
      // ═══ PHOTO FILE ═══
      const photoInput = document.querySelector('input[name="photo"]');
      if (photoInput && photoInput.files && photoInput.files[0]) {
        submissionData.append('photo', photoInput.files[0]);
      }
      
      const selectedBatch = batches.find(b => b._id === batchId);
      submissionData.append('slotKey', `${selectedBatch.type}|${selectedBatch.dayId}|${selectedBatch.time}`);
      submissionData.append('classType', selectedBatch.type);
      submissionData.append('dayId', selectedBatch.dayId);
      submissionData.append('time', selectedBatch.time);
      submissionData.append('batchId', batchId);
      submissionData.append('amountPaid', calculateAmount());
      
      // Payment details
      submissionData.append('paymentMethod', paymentMethod);
      submissionData.append('paymentStatus', paymentStatus);
      submissionData.append('currentLevel', currentLevel || 0);
      
      if (paymentStatus === 'pending') {
        submissionData.append('offlinePaymentRef', formData.paymentRef || `PENDING-${Date.now()}`);
      } else {
        submissionData.append('offlinePaymentRef', formData.paymentRef || `PAID-${Date.now()}`);
      }

      const result = await dispatch(createStudent(submissionData)).unwrap();
      
      setShowManualEntry(false);
      setFormData({
        childName: '',
        childAge: '',
        dateOfBirth: '',
        childClass: '',
        schoolName: '',
        parentName: '',
        email: '',
        contact1: '',
        contact2: '',
        batchId: '',
        kitOptIn: false,
        amountPaid: 0,
        paymentRef: '',
        paymentMethod: 'Cash',
        paymentStatus: 'completed',
        currentLevel: 0,
      });
      
      // Reset validation states
      setDobError('');
      setAgeAutoCalcMsg('');
      setIsDobValid(false);
      
      // Reset file input
      const photoInputReset = document.querySelector('input[name="photo"]');
      if (photoInputReset) photoInputReset.value = '';
      
      const statusMsg = result.currentLevel > 0
        ? `Student enrolled at Level ${result.currentLevel}!`
        : 'Student enrolled as a newbie. Start their Level 1 journey when ready.';
      alert(`✅ ${statusMsg}`);
    } catch (err) {
      setFormError(err || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading students...</p>
        </div>
      </div>
    );
  }

  const filteredStudents = filterStudents();
  const amount = calculateAmount();

  return (
    <div>
      {batchIdFilter && selectedBatch && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-blue-800">
            📋 Showing students for: <strong>{getBatchDisplayName(selectedBatch)}</strong>
            <span className="ml-2 text-xs font-normal text-blue-600">
              ({filteredStudents.length} students)
            </span>
          </span>
          <button
            onClick={clearBatchFilter}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {getFilterOptions().map((opt) => (
          <button
            key={opt.id}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-150 whitespace-nowrap
              ${filter === opt.id 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-muted border-[#e8e4f0] hover:border-primary hover:text-primary'
              }`}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search student…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowManualEntry(true)}>
          ➕ Add Student
        </Button>
        <Button variant="outline" onClick={() => setRefreshTrigger(prev => prev + 1)}>
          🔄 Refresh
        </Button>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-5xl mb-3">👦</div>
          <p className="text-sm">No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={handleViewStudent}
              onStartLevel={handleStartLevelJourney}
            />
          ))}
        </div>
      )}

      <StudentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        student={selectedStudent}
        onStartLevel={handleStartLevelJourney}
        onStudentUpdated={handleStudentUpdated}
      />

      {/* ═══ MANUAL ENTRY MODAL (UPDATED WITH AUTO-CALCULATED AGE) ═══ */}
      <Modal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="➕ Manual Student Entry"
        subtitle="Offline / Cash Payment — No Razorpay required"
        headerGradient="from-indigo-600 to-purple-600"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={isSubmitting || !isDobValid}
              className={!isDobValid && formData.dateOfBirth ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isSubmitting ? '⏳ Saving…' : '💾 Save Student'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              ❌ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Child Details */}
            <div className="md:col-span-2">
              <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
                👦 Child Details
              </h4>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Child Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleFormChange}
                placeholder="e.g. Riya Sharma"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors
                  ${dobError ? 'border-red-500 bg-red-50' : 
                    isDobValid && formData.dateOfBirth ? 'border-green-500 bg-green-50' : 
                    'border-[#e8e4f0]'}`}
                required
              />
              {dobError && (
                <p className="text-xs text-red-500 mt-1">❌ {dobError}</p>
              )}
              {ageAutoCalcMsg && !dobError && (
                <p className="text-xs text-green-600 mt-1">✅ {ageAutoCalcMsg}</p>
              )}
              <p className="text-xs text-muted mt-1">
                Age will be auto-calculated from Date of Birth
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="childAge"
                value={formData.childAge}
                readOnly
                placeholder="Auto-calculated from DOB"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors cursor-not-allowed bg-gray-50
                  ${isDobValid && formData.dateOfBirth ? 'border-green-500 bg-green-50' : 
                    'border-[#e8e4f0] bg-gray-50'}`}
              />
              <p className="text-xs text-muted mt-1">
                {isDobValid ? '✅ Auto-calculated from Date of Birth' : 'Enter DOB to auto-calculate age'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Class / Grade</label>
              <input
                type="text"
                name="childClass"
                value={formData.childClass}
                onChange={handleFormChange}
                placeholder="e.g. 3rd Grade"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">School Name</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleFormChange}
                placeholder="e.g. DAV School"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {/* Parent Details */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
                👤 Parent Details
              </h4>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Parent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleFormChange}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="parent@email.com"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Contact 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="contact1"
                value={formData.contact1}
                onChange={handleFormChange}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Contact 2</label>
              <input
                type="tel"
                name="contact2"
                value={formData.contact2}
                onChange={handleFormChange}
                placeholder="Alternate number"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Assign to Batch <span className="text-red-500">*</span>
              </label>
              <select
                name="batchId"
                value={formData.batchId}
                onChange={(e) => {
                  handleFormChange(e);
                  handleBatchChange(e);
                }}
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                required
              >
                <option value="">Select a batch…</option>
                
                {/* ═══ GROUP: OFFLINE BATCHES ═══ */}
                {Array.isArray(batches) && batches.filter(b => 
                  (b.status === 'active' || b.status === 'filling') && b.type === 'offline'
                ).length > 0 && (
                  <optgroup label="🏫 Offline Batches">
                    {batches.filter(b => 
                      (b.status === 'active' || b.status === 'filling') && b.type === 'offline'
                    ).map((b) => {
                      const displayName = getBatchShortName(b);
                      return (
                        <option key={b._id} value={b._id}>
                          {displayName} ({b.enrolledStudents?.length || 0}/{b.capacity})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                
                {/* ═══ GROUP: ONLINE BATCHES ═══ */}
                {Array.isArray(batches) && batches.filter(b => 
                  (b.status === 'active' || b.status === 'filling') && b.type === 'online'
                ).length > 0 && (
                  <optgroup label="💻 Online Batches">
                    {batches.filter(b => 
                      (b.status === 'active' || b.status === 'filling') && b.type === 'online'
                    ).map((b) => {
                      const displayName = getBatchShortName(b);
                      return (
                        <option key={b._id} value={b._id}>
                          {displayName} ({b.enrolledStudents?.length || 0}/{b.capacity})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-muted mt-1">
                Batches are grouped by type (Offline/Online) for easier selection.
              </p>
            </div>

            {/* ═══ Payment Section ═══ */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
                💵 Payment Details
              </h4>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Amount Paid (₹)</label>
              <div className="flex items-center border border-[#e8e4f0] rounded-lg overflow-hidden bg-gray-50">
                <span className="bg-gray-100 px-4 py-2 text-sm font-bold text-secondary">₹</span>
                <input
                  type="number"
                  name="amountPaid"
                  value={amount}
                  readOnly
                  className="w-full px-3 py-2 border-none outline-none font-bold text-gray-700 bg-gray-50 cursor-default"
                />
                <span className="bg-gray-100 px-4 py-2 text-xs text-muted whitespace-nowrap">
                  {formData.batchId && Array.isArray(batches) && batches.find(b => b._id === formData.batchId)?.type === 'offline' ? 'Offline' : 'Online'}
                  {formData.kitOptIn ? ' + Kit' : ''}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Auto-calculated: Offline ₹2500 · Online ₹2200 · +₹2000 if Kit included
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="kitOptIn"
                  checked={formData.kitOptIn}
                  onChange={handleFormChange}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include Enrollment Kit (₹{KIT_FEE} extra)</span>
              </label>
            </div>

            {/* ═══ PAYMENT METHOD ═══ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                required
              >
                <option value="Cash">💰 Cash</option>
                <option value="UPI">📱 UPI</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Other">📝 Other</option>
              </select>
            </div>

            {/* ═══ PAYMENT STATUS ═══ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="completed"
                    checked={formData.paymentStatus === 'completed'}
                    onChange={handleFormChange}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-sm font-medium text-green-600">✅ Paid (First Month)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="pending"
                    checked={formData.paymentStatus === 'pending'}
                    onChange={handleFormChange}
                    className="w-4 h-4 accent-yellow-500"
                  />
                  <span className="text-sm font-medium text-yellow-600">⏳ Pending (Will Pay Later)</span>
                </label>
              </div>
              <p className="text-xs text-muted mt-1">
                {formData.paymentStatus === 'pending' 
                  ? '⚠️ Student will be enrolled but first month fee will be marked as Pending.' 
                  : '✅ First month fee marked as Paid. Student enrollment is complete.'}
              </p>
            </div>

            {/* ═══ RECEIPT / REFERENCE ═══ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Receipt / Ref No. <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="paymentRef"
                value={formData.paymentRef}
                onChange={handleFormChange}
                placeholder="e.g. RCPT-001 or Cash"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {/* ═══ PHOTO UPLOAD ═══ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Child Photo <small className="text-muted font-normal">(optional)</small>
              </label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
              <p className="text-xs text-muted mt-1">
                Upload a passport-size photo of the child (JPG, PNG, max 2MB)
              </p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};