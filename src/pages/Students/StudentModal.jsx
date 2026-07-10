import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, StatusPill, Button } from '../../components/common';
import { fetchStudentFees, updateStudentStatus, deleteStudent, markFeePaid, updateStudentPayment } from '../../store/slices/studentSlice';
import { endpoints } from '../../api/endpoints';
import { getBatchLabel, getPhotoUrl } from '../../utils/helpers';

export const StudentModal = ({ isOpen, onClose, student, onStartLevel, onStudentUpdated }) => {
  const dispatch = useDispatch();
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // ─── EDIT MODE STATE ──────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // ─── LOAD FEES ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && student) {
      loadFees();
      
      let parsedDate = '';
      if (student.dateOfBirth) {
        try {
          const d = new Date(student.dateOfBirth);
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Invalid dateOfBirth:', student.dateOfBirth);
        }
      }

      const rawAge = student.childAge ? student.childAge.toString().replace(/\D/g, '') : '';

      setEditForm({
        childName: student.childName || '',
        childAge: rawAge,
        dateOfBirth: parsedDate,
        childClass: student.childClass || '',
        schoolName: student.schoolName || '',
        parentName: student.parentName || '',
        email: student.email || '',
        contact1: student.contact1 || '',
        contact2: student.contact2 || '',
        classType: student.classType || 'offline',
        dayId: student.dayId || 'monfri',
        time: student.time || '',
        kitOptIn: student.kitOptIn || false,
        paymentStatus: student.paymentStatus || 'Completed',
        paymentMethod: student.paymentMethod || 'Razorpay',
        amountPaid: student.amountPaid || 0,
        currentLevel: student.currentLevel || 0,
        enrollmentStatus: student.enrollmentStatus || 'active',
        status: student.status || 'active',
      });
      setEditErrors({});
      setIsEditing(false);
    }
  }, [isOpen, student]);

  const initializeEditForm = () => {
    if (!student) return;
    let parsedDate = '';
    if (student.dateOfBirth) {
      try {
        const d = new Date(student.dateOfBirth);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Invalid dateOfBirth:', student.dateOfBirth);
      }
    }

    setEditForm({
      childName: student.childName || '',
      childAge: student.childAge || '',
      dateOfBirth: parsedDate,
      childClass: student.childClass || '',
      schoolName: student.schoolName || '',
      parentName: student.parentName || '',
      email: student.email || '',
      contact1: student.contact1 || '',
      contact2: student.contact2 || '',
      classType: student.classType || 'offline',
      dayId: student.dayId || 'monfri',
      time: student.time || '',
      kitOptIn: student.kitOptIn || false,
      paymentStatus: student.paymentStatus || 'Completed',
      paymentMethod: student.paymentMethod || 'Razorpay',
      amountPaid: student.amountPaid || 0,
      currentLevel: student.currentLevel || 0,
      enrollmentStatus: student.enrollmentStatus || 'active',
      status: student.status || 'active',
    });
    setEditErrors({});
  };

  const loadFees = async () => {
    setIsLoading(true);
    try {
      const backendId = student._id || student.id;
      const result = await dispatch(fetchStudentFees(backendId)).unwrap();
      setFees(result?.fees || result || []);
    } catch (error) {
      console.error('Failed to load fees:', error);
    }
    setIsLoading(false);
  };

  if (!student) return null;

  const photoUrl = getPhotoUrl(student);
  
  const getBatchDisplayName = () => {
    if (!student.batchId) return 'Unassigned';
    const dayLabel = student.dayId === 'monfri' ? 'Mon/Fri'
      : student.dayId === 'tuethu' ? 'Tue/Thu'
      : 'Sat/Sun';
    return `${dayLabel} · ${student.time}`;
  };
  
  const batchLabel = getBatchDisplayName();
  
  const isPaymentCompleted = student.paymentStatus === 'Completed' || student.razorpayPaymentId;
  const isPaymentPending = student.paymentStatus === 'Pending' || 
    (student.razorpayPaymentId && student.razorpayPaymentId.startsWith('PENDING-'));
  
  const feeCoverage = student.feeCoverage || 'pending_first_month';
  const isFirstMonthPaid = feeCoverage === 'first_month';
  const isFirstMonthPending = feeCoverage === 'pending_first_month';
  
  const paymentOk = isPaymentCompleted;
  const paymentPending = isPaymentPending;
  
  const enrolledDate = student.createdAt ? new Date(student.createdAt) : new Date();

  // ─── EDIT FORM HANDLERS ────────────────────────────────────────────
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setEditForm(prev => {
      const updatedForm = { ...prev, [name]: newValue };
      
      // Auto-calculate age from DOB
      if (name === 'dateOfBirth' && newValue) {
        const dob = new Date(newValue);
        if (!isNaN(dob.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          if (age >= 0) {
            updatedForm.childAge = age;
          }
        }
      }
      return updatedForm;
    });

    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    const required = ['childName', 'parentName', 'contact1', 'childAge'];
    
    required.forEach(field => {
      if (!editForm[field] || editForm[field].toString().trim() === '') {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (editForm.contact1 && !/^\d{10}$/.test(editForm.contact1.replace(/\D/g, ''))) {
      errors.contact1 = 'Please enter a valid 10-digit phone number';
    }
    if (editForm.contact2 && !/^\d{10}$/.test(editForm.contact2.replace(/\D/g, ''))) {
      errors.contact2 = 'Please enter a valid 10-digit phone number';
    }

    if (editForm.childAge && (isNaN(editForm.childAge) || editForm.childAge < 3 || editForm.childAge > 16)) {
      errors.childAge = 'Age must be between 3 and 16';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── SAVE EDITS ────────────────────────────────────────────────────
  const handleSaveEdits = async () => {
    if (!validateEditForm()) {
      const firstError = document.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    if (!window.confirm('Are you sure you want to save these changes?')) {
      return;
    }

    setIsSaving(true);

    try {
      const backendId = student._id || student.id;
      const updateData = {
        childName: editForm.childName,
        childAge: editForm.childAge,
        childClass: editForm.childClass,
        schoolName: editForm.schoolName,
        parentName: editForm.parentName,
        email: editForm.email,
        contact1: editForm.contact1,
        contact2: editForm.contact2 || '',
        classType: editForm.classType,
        dayId: editForm.dayId,
        time: editForm.time,
        kitOptIn: editForm.kitOptIn,
        paymentStatus: editForm.paymentStatus,
        paymentMethod: editForm.paymentMethod,
        amountPaid: editForm.amountPaid,
        currentLevel: editForm.currentLevel,
        enrollmentStatus: editForm.enrollmentStatus,
        status: editForm.status,
      };

      if (editForm.dateOfBirth) {
        const dob = new Date(editForm.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          updateData.dateOfBirth = dob;
        }
      }

      const response = await endpoints.students.update(backendId, updateData);
      
      if (response.success) {
        alert('✅ Student details updated successfully!');
        setIsEditing(false);
        if (onStudentUpdated) {
          onStudentUpdated();
        }
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('Failed to update student:', error);
      alert('❌ Failed to update student: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CANCEL EDIT ────────────────────────────────────────────────────
  const handleCancelEdit = () => {
    if (window.confirm('Discard all changes?')) {
      setIsEditing(false);
      initializeEditForm();
      setEditErrors({});
    }
  };

  // ─── TOGGLE EDIT MODE ──────────────────────────────────────────────
  const toggleEditMode = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isEditing) {
      // Cancel mode: reset and close edit
      setEditErrors({});
      setIsEditing(false);
      initializeEditForm();
    } else {
      // Enter edit mode: initialize form with current data
      let parsedDate = '';
      if (student.dateOfBirth) {
        try {
          const d = new Date(student.dateOfBirth);
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Invalid dateOfBirth:', student.dateOfBirth);
        }
      }
      
      const rawAge = student.childAge ? student.childAge.toString().replace(/\D/g, '') : '';
      
      const freshForm = {
        childName: student.childName || '',
        childAge: rawAge,
        dateOfBirth: parsedDate,
        childClass: student.childClass || '',
        schoolName: student.schoolName || '',
        parentName: student.parentName || '',
        email: student.email || '',
        contact1: student.contact1 || '',
        contact2: student.contact2 || '',
        classType: student.classType || 'offline',
        dayId: student.dayId || 'monfri',
        time: student.time || '',
        kitOptIn: student.kitOptIn || false,
        paymentStatus: student.paymentStatus || 'Completed',
        paymentMethod: student.paymentMethod || 'Razorpay',
        amountPaid: student.amountPaid || 0,
        currentLevel: student.currentLevel || 0,
        enrollmentStatus: student.enrollmentStatus || 'active',
        status: student.status || 'active',
      };
      setEditForm(freshForm);
      setEditErrors({});
      setIsEditing(true);
    }
  };

  // ═══ Handle marking admission fee as paid ═══
  const handleMarkAdmissionPaid = async () => {
    const amountStr = window.prompt(`Enter the fee amount collected for ${student.childName}:`, String(student.amountPaid || 2500));
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; }

    const method = window.prompt('Enter Payment Method (e.g., Cash, UPI, Bank Transfer):', 'UPI');
    if (method === null) return;

    try {
      const backendId = student._id || student.id;
      await dispatch(updateStudentPayment({
        studentId: backendId,
        paymentData: {
          paymentStatus: 'Completed',
          razorpayPaymentId: `MANUAL-${Date.now()}`,
          amountPaid: amount,
          paymentMethod: method,
          feeCoverage: 'first_month'
        }
      })).unwrap();
      
      alert('✅ First month fee marked as Paid!');
      window.location.reload(); 
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Error marking fee as paid: ' + error.message);
    }
  };

  // ═══ Handle marking a monthly fee as paid ═══
  const handleMarkFeePaid = async (month, year) => {
    const amountStr = window.prompt(`Enter the fee amount collected for ${month} ${year}:`, '2500');
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; }

    const method = window.prompt('Enter Payment Method (e.g., Cash, UPI, Bank Transfer):', 'UPI');
    if (method === null) return;

    try {
      const backendId = student._id || student.id;
      await dispatch(markFeePaid({ studentId: backendId, data: { month, year, amount, status: 'Paid', paymentMethod: method } })).unwrap();
      
      if (month === new Date().toLocaleString('en-IN', { month: 'long' }) && year === new Date().getFullYear() && feeCoverage === 'pending_first_month') {
        await dispatch(updateStudentPayment({
          studentId: backendId,
          paymentData: { feeCoverage: 'first_month' }
        })).unwrap();
      }
      
      await loadFees();
      alert('✅ Fee marked as Paid!');
    } catch (error) {
      alert('Failed to mark fee as paid: ' + error.message);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = student.status === 'active' ? 'paused' : 'active';
    const backendId = student._id || student.id;
    try {
      await dispatch(updateStudentStatus({ studentId: backendId, status: newStatus })).unwrap();
      onClose();
      if (onStudentUpdated) onStudentUpdated();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      const backendId = student._id || student.id;
      try {
        await dispatch(deleteStudent(backendId)).unwrap();
        onClose();
        if (onStudentUpdated) onStudentUpdated();
      } catch (error) {
        alert('Failed to delete student: ' + error.message);
      }
    }
  };

  const handleUpdateLevel = async (newLevel) => {
    if (!window.confirm(`Change ${student.childName}'s level to ${newLevel}?`)) {
      return;
    }

    try {
      const data = await endpoints.students.updateLevel(student._id || student.id, newLevel);
      if (data.success) {
        alert(`Level updated to ${newLevel} for ${student.childName}!`);
        if (onStudentUpdated) onStudentUpdated();
        window.location.reload(); 
      } else {
        alert('Failed to update level: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update level:', error);
      alert('Error updating level');
    }
  };

  // ═══ Generate month list for fee tracking ═══
  const generateMonthList = () => {
    const months = [];
    const currentDate = new Date();
    let trackDate = new Date(
      enrolledDate.getFullYear(),
      enrolledDate.getMonth(),
      1
    );
    
    while (trackDate <= currentDate) {
      months.push({
        month: trackDate.toLocaleString('en-IN', { month: 'long' }),
        year: trackDate.getFullYear(),
      });
      trackDate.setMonth(trackDate.getMonth() + 1);
    }
    
    months.push({
      month: trackDate.toLocaleString('en-IN', { month: 'long' }),
      year: trackDate.getFullYear(),
    });
    
    return months;
  };

  const monthList = generateMonthList();

  // ═══ Render fee rows ═══
  const renderFeeRow = (month, year, idx) => {
    const record = fees.find(f => f.month === month && String(f.year) === String(year));
    const isPaid = record && record.status === 'Paid';
    const isFirstMonth = idx === 0;

    if (isFirstMonth) {
      const admissionStatus = paymentPending ? 'Pending' : (paymentOk ? 'Paid' : 'Unknown');
      const admissionStatusVariant = paymentPending ? 'yellow' : (paymentOk ? 'green' : 'red');
      
      return (
        <tr key={`${month}-${year}`}>
          <td className="py-2">
            <strong>{month} {year}</strong>
            <div className="text-xs text-muted">Initial Enrollment</div>
            {feeCoverage === 'pending_first_month' && (
              <span className="text-xs text-yellow-600">⏳ Payment Pending</span>
            )}
          </td>
          <td>
            <StatusPill variant={admissionStatusVariant}>{admissionStatus}</StatusPill>
          </td>
          <td>₹{Number(student.amountPaid || 0).toLocaleString('en-IN')}</td>
          <td>
            {student.paymentMethod || 
             (student.razorpayPaymentId?.startsWith('OFFLINE-') ? 'Offline / Cash' : 
              student.razorpayPaymentId?.startsWith('PENDING-') ? 'Pending' :
              student.razorpayPaymentId || '—')}
          </td>
          <td>
            {paymentPending ? (
              <Button variant="primary" size="sm" onClick={handleMarkAdmissionPaid}>
                Mark Paid
              </Button>
            ) : paymentOk ? (
              <span className="text-xs text-muted">
                Paid on {enrolledDate.toLocaleDateString('en-IN')}
              </span>
            ) : '—'}
          </td>
        </tr>
      );
    }

    return (
      <tr key={`${month}-${year}`}>
        <td className="py-2"><strong>{month} {year}</strong></td>
        <td><StatusPill variant={isPaid ? 'green' : 'red'}>{isPaid ? 'Paid' : 'Pending'}</StatusPill></td>
        <td>{record ? `₹${Number(record.amount || 0).toLocaleString('en-IN')}` : '—'}</td>
        <td>{record?.paymentMethod || '—'}</td>
        <td>
          {isPaid ? (
            <span className="text-xs text-muted">
              Paid on {new Date(record.paidAt).toLocaleDateString('en-IN')}
            </span>
          ) : (
            <Button variant="primary" size="sm" onClick={() => handleMarkFeePaid(month, year)}>Mark Paid</Button>
          )}
        </td>
      </tr>
    );
  };

  // ─── EDIT FORM RENDER ──────────────────────────────────────────────
  const renderEditForm = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3">
        <p className="text-sm text-yellow-700 font-semibold">
          ⚠️ Editing student details. All changes will be saved to the database.
        </p>
      </div>

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
            value={editForm.childName || ''}
            onChange={handleEditChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
              editErrors.childName ? 'border-red-500 bg-red-50 field-error' : 'border-[#e8e4f0]'
            }`}
          />
          {editErrors.childName && <p className="text-xs text-red-500 mt-1">{editErrors.childName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={editForm.dateOfBirth || ''}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="childAge"
            value={editForm.childAge || ''}
            readOnly
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
          />
          <p className="text-xs text-muted mt-1">Age is calculated automatically from Date of Birth.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Class / Grade</label>
          <input
            type="text"
            name="childClass"
            value={editForm.childClass || ''}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">School Name</label>
          <input
            type="text"
            name="schoolName"
            value={editForm.schoolName || ''}
            onChange={handleEditChange}
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
            value={editForm.parentName || ''}
            onChange={handleEditChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
              editErrors.parentName ? 'border-red-500 bg-red-50 field-error' : 'border-[#e8e4f0]'
            }`}
          />
          {editErrors.parentName && <p className="text-xs text-red-500 mt-1">{editErrors.parentName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={editForm.email || ''}
            onChange={handleEditChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
              editErrors.email ? 'border-red-500 bg-red-50 field-error' : 'border-[#e8e4f0]'
            }`}
          />
          {editErrors.email && <p className="text-xs text-red-500 mt-1">{editErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Contact 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="contact1"
            value={editForm.contact1 || ''}
            onChange={handleEditChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
              editErrors.contact1 ? 'border-red-500 bg-red-50 field-error' : 'border-[#e8e4f0]'
            }`}
          />
          {editErrors.contact1 && <p className="text-xs text-red-500 mt-1">{editErrors.contact1}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Contact 2</label>
          <input
            type="tel"
            name="contact2"
            value={editForm.contact2 || ''}
            onChange={handleEditChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
              editErrors.contact2 ? 'border-red-500 bg-red-50 field-error' : 'border-[#e8e4f0]'
            }`}
          />
          {editErrors.contact2 && <p className="text-xs text-red-500 mt-1">{editErrors.contact2}</p>}
        </div>

        {/* Enrollment Details */}
        <div className="md:col-span-2 mt-2">
          <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
            📋 Enrollment Details
          </h4>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Class Type</label>
          <select
            name="classType"
            value={editForm.classType || 'offline'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="offline">🏫 Offline</option>
            <option value="online">💻 Online</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Day</label>
          <select
            name="dayId"
            value={editForm.dayId || 'monfri'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="monfri">Monday & Friday</option>
            <option value="tuethu">Tuesday & Thursday</option>
            <option value="satsu">Saturday & Sunday</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Time</label>
          <input
            type="text"
            name="time"
            value={editForm.time || ''}
            onChange={handleEditChange}
            placeholder="e.g. 4:00–5:00 PM"
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="kitOptIn"
              checked={!!editForm.kitOptIn}
              onChange={handleEditChange}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-semibold">Enrollment Kit Included</span>
          </label>
        </div>

        {/* Status */}
        <div className="md:col-span-2 mt-2">
          <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
            📊 Status & Level
          </h4>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Student Status</label>
          <select
            name="status"
            value={editForm.status || 'active'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="active">✅ Active</option>
            <option value="paused">⏸️ Paused</option>
            <option value="inactive">🔴 Inactive</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Enrollment Status</label>
          <select
            name="enrollmentStatus"
            value={editForm.enrollmentStatus || 'active'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="pending">⏳ Pending</option>
            <option value="active">✅ Active</option>
            <option value="paused">⏸️ Paused</option>
            <option value="withdrawn">🚫 Withdrawn</option>
            <option value="completed">✅ Completed</option>
            <option value="graduated">🎓 Graduated</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Current Level</label>
          <select
            name="currentLevel"
            value={editForm.currentLevel !== undefined ? editForm.currentLevel : 0}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
              <option key={level} value={level}>
                {level === 0 ? 'Newbie (Not Started)' : `Level ${level}`}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Details */}
        <div className="md:col-span-2 mt-2">
          <h4 className="text-secondary text-sm font-bold uppercase tracking-wider border-b-2 border-dashed border-[#e8e4f0] pb-2 mb-3">
            💳 Payment Details
          </h4>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Payment Status</label>
          <select
            name="paymentStatus"
            value={editForm.paymentStatus || 'Completed'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="Completed">✅ Completed</option>
            <option value="Pending">⏳ Pending</option>
            <option value="Failed">❌ Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={editForm.paymentMethod || 'Razorpay'}
            onChange={handleEditChange}
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          >
            <option value="Razorpay">💳 Razorpay</option>
            <option value="Cash">💰 Cash</option>
            <option value="UPI">📱 UPI</option>
            <option value="Bank Transfer">🏦 Bank Transfer</option>
            <option value="Other">📝 Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Amount Paid (₹)</label>
          <input
            type="number"
            name="amountPaid"
            value={editForm.amountPaid || 0}
            onChange={handleEditChange}
            min="0"
            className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>
    </div>
  );

  // ─── VIEW MODE RENDER ──────────────────────────────────────────────
  const renderViewMode = () => (
    <>
      {/* Status Badges */}
      <div className="text-center mb-4 space-x-2">
        {paymentOk ? (
          <StatusPill variant="green">✅ Payment Verified</StatusPill>
        ) : paymentPending ? (
          <StatusPill variant="yellow">⏳ Payment Pending</StatusPill>
        ) : (
          <StatusPill variant="red">❌ Payment Failed</StatusPill>
        )}
        <StatusPill variant={student.status === 'active' ? 'green' : 'red'}>
          {student.status}
        </StatusPill>
      </div>

      {/* Fee Coverage Status */}
      <div className="mb-4 p-3 rounded-lg border" style={{
        background: isFirstMonthPaid ? '#f0fdf4' : '#fefce8',
        borderColor: isFirstMonthPaid ? '#bbf7d0' : '#fde68a'
      }}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">💳 Fee Coverage:</span>
          <StatusPill variant={isFirstMonthPaid ? 'green' : 'yellow'}>
            {isFirstMonthPaid ? '✅ First Month Paid' : '⏳ First Month Pending'}
          </StatusPill>
        </div>
        <div className="text-xs text-muted mt-1">
          {isFirstMonthPaid 
            ? `First month (${student.feeStartMonth || '—'}) included in enrollment payment` 
            : 'First month fee is pending. Please collect payment.'}
        </div>
      </div>

      {/* Child Details */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          👶 Child Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Enrollment ID</span>
            <span className="font-mono text-xs">{student.enrollmentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="font-semibold">{student.childName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Age</span>
            <span>{student.childAge}</span>
          </div>
          {student.dateOfBirth && (
            <div className="flex justify-between">
              <span className="text-muted">Date of Birth</span>
              <span>{new Date(student.dateOfBirth).toLocaleDateString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Class / Grade</span>
            <span>{student.childClass}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">School</span>
            <span>{student.schoolName}</span>
          </div>
        </div>
      </div>

      {/* Parent Details */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          👤 Parent / Guardian
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span>{student.parentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Primary Contact</span>
            <a href={`tel:${student.contact1}`} className="text-secondary">{student.contact1}</a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Emergency Contact</span>
            <a href={`tel:${student.contact2}`} className="text-secondary">{student.contact2}</a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span>{student.email || '—'}</span>
          </div>
        </div>
      </div>

      {/* Current Level */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          🎓 Current Level
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Current Level</span>
            <span className="font-nunito font-extrabold text-primary text-lg">
              {student.currentLevel === 0 ? 'Newbie (Not Started)' : `Level ${student.currentLevel} / 12`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary rounded-full h-2.5 transition-all"
              style={{ width: `${((student.currentLevel || 0) / 12) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted">
              {student.levelHistory?.filter(h => h.completedDate).length || 0} levels completed
            </span>
            {student.currentLevel === 0 && onStartLevel && (
              <Button variant="primary" size="sm" onClick={() => { onStartLevel(student.id); onClose(); }}>
                🚀 Start Level 1
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Details */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          🎨 Enrollment Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Class Type</span>
            <StatusPill variant={student.classType === 'offline' ? 'blue' : 'purple'} className="text-xs">
              {student.classType}
            </StatusPill>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Batch</span>
            <span>{batchLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Enrollment Kit</span>
            <StatusPill variant={student.kitOptIn ? 'green' : 'gray'}>
              {student.kitOptIn ? '🎒 Yes, Included' : 'No'}
            </StatusPill>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Enrolled On</span>
            <span>{enrolledDate.toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Status</span>
            <StatusPill variant={student.status === 'active' ? 'green' : student.status === 'paused' ? 'yellow' : 'red'}>
              {student.status}
            </StatusPill>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Enrollment Status</span>
            <StatusPill variant={student.enrollmentStatus === 'active' ? 'green' : student.enrollmentStatus === 'pending' ? 'yellow' : 'red'}>
              {student.enrollmentStatus}
            </StatusPill>
          </div>
        </div>
      </div>

      {/* Admission Payment */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          💳 Admission Payment
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Amount Paid</span>
            <span className="font-nunito font-extrabold text-primary text-lg">₹{Number(student.amountPaid || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Covers</span>
            <span>First Month Fee{student.kitOptIn ? ' + Enrollment Kit' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment Status</span>
            <StatusPill variant={paymentOk ? 'green' : paymentPending ? 'yellow' : 'red'}>
              {paymentPending ? 'Pending' : (paymentOk ? 'Completed' : '—')}
            </StatusPill>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment Method</span>
            <span className="font-semibold">{student.paymentMethod || 'Razorpay'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fee Coverage</span>
            <StatusPill variant={isFirstMonthPaid ? 'green' : 'yellow'}>
              {isFirstMonthPaid ? '✅ First Month Paid' : '⏳ Pending'}
            </StatusPill>
          </div>
          {student.razorpayPaymentId?.startsWith('OFFLINE-') ? (
            <div className="flex justify-between">
              <span className="text-muted">Receipt / Ref</span>
              <span className="font-mono text-xs">{student.razorpayPaymentId.replace('OFFLINE-', '')}</span>
            </div>
          ) : student.razorpayPaymentId?.startsWith('PENDING-') ? (
            <div className="flex justify-between">
              <span className="text-muted">Receipt / Ref</span>
              <span className="font-mono text-xs">{student.razorpayPaymentId.replace('PENDING-', '')}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted">Razorpay Order ID</span>
                <span className="font-mono text-xs">{student.razorpayOrderId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment ID</span>
                <span className="font-mono text-xs">{student.razorpayPaymentId || '—'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Fee Tracking */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          📅 Monthly Fee Tracking
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-muted">Month</th>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-muted">Status</th>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-muted">Amount</th>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-muted">Method</th>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3ff]">
              {monthList.map((m, idx) => renderFeeRow(m.month, m.year, idx))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Level Management */}
      <div className="mt-6">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-[#e8e4f0] pb-2 mb-3">
          🎓 Level Management & Certificates
        </h4>
        
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Progress: {student.currentLevel || 0}/12</span>
            <span>{Math.round(((student.currentLevel || 0) / 12) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-secondary to-primary rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${((student.currentLevel || 0) / 12) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => {
            const isCompleted = level < student.currentLevel;
            const isCurrent = level === student.currentLevel;
            
            let variant = "outline";
            let className = "";
            let label = String(level);
            let title = `Set to Level ${level}`;
            
            if (isCompleted) {
              variant = "outline";
              className = "bg-green-50 border-green-300 text-green-700 hover:bg-green-100";
              label = `${level} ✅`;
              title = `Level ${level} - Completed`;
            } else if (isCurrent) {
              variant = "primary";
              className = "bg-secondary border-secondary text-white hover:bg-secondary-dark shadow-lg shadow-secondary/30";
              label = `${level} ⭐`;
              title = `Level ${level} - Current Level`;
            } else {
              className = "opacity-60 hover:opacity-100";
              title = `Set to Level ${level}`;
            }
            
            return (
              <Button
                key={level}
                variant={variant}
                size="sm"
                onClick={() => handleUpdateLevel(level)}
                className={className}
                title={title}
                disabled={isCompleted}
              >
                {label}
              </Button>
            );
          })}
        </div>
        
        <div className="mt-3 text-xs text-muted flex flex-wrap gap-3">
          <span>✅ Completed: {Math.max(0, (student.currentLevel || 0) - 1)} levels</span>
          <span>⭐ Current: {student.currentLevel === 0 ? 'Not Started' : `Level ${student.currentLevel}`}</span>
          <span>📚 Remaining: {Math.max(0, 12 - (student.currentLevel || 0))} levels</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {[1, 2, 3, 4].map(level => {
            const isAvailable = level <= student.currentLevel;
            return (
              <Button
                key={`cert-${level}`}
                variant={isAvailable ? "outline" : "outline"}
                size="sm"
                onClick={() => {
                  if (isAvailable) {
                    window.open(`/certificate?sid=${student._id || student.id}&level=${level}`, '_blank');
                  }
                }}
                className={isAvailable ? "" : "opacity-40 cursor-not-allowed"}
                disabled={!isAvailable}
                title={isAvailable ? `Generate Level ${level} Certificate` : `Complete Level ${level} first`}
              >
                {isAvailable ? `📜 Level ${level}` : `🔒 Level ${level}`}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✏️ Edit Student Details' : student.childName}
      subtitle={isEditing ? 'Update student information' : `${student.childAge} · ${student.childClass} · ${student.schoolName}`}
      headerGradient="from-secondary to-indigo-600"
      maxWidth="max-w-3xl"
      footer={
        isEditing ? (
          <div className="flex justify-end gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveEdits}
              disabled={isSaving}
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
        ) : (
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="primary" 
              onClick={toggleEditMode}
            >
              ✏️ Edit Details
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://wa.me/91${student.contact1?.replace(/\D/g, '')}`, '_blank')}
            >
              📲 WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="text-red-500 border-red-500 hover:border-red-600 hover:text-red-600"
              onClick={handleDelete}
            >
              🗑 Delete
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handleToggleStatus}
            >
              {student.status === 'active' ? '⏸ Pause' : '▶ Activate'}
            </Button>
          </div>
        )
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        isEditing ? renderEditForm() : renderViewMode()
      )}
    </Modal>
  );
};