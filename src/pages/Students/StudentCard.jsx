import React from 'react';
import { StatusPill, Button } from '../../components/common';
import { getBatchLabel, getPhotoUrl } from '../../utils/helpers';

export const StudentCard = ({ student, onClick, onStartLevel }) => {
  const photoUrl = getPhotoUrl(student);
  const batchLabel = getBatchLabel(student);
  
  // ═══ Check payment status ═══
  const isPaymentCompleted = student.paymentStatus === 'Completed' || student.razorpayPaymentId;
  const isPaymentPending = student.paymentStatus === 'Pending' || 
    (student.razorpayPaymentId && student.razorpayPaymentId.startsWith('PENDING-'));
  
  const paymentOk = isPaymentCompleted;
  const paymentPending = isPaymentPending;

  return (
    <div 
      className="card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden"
      onClick={() => onClick(student.id)}
    >
      {/* Gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

      <div className="flex items-start gap-4 mb-4">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={student.childName} 
            className="w-14 h-14 rounded-full object-cover border-2 border-primary flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-nunito font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
            {student.childName?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{student.childName}</div>
          <div className="text-xs text-muted font-mono">{student.enrollmentId}</div>
          <div className="text-xs text-muted">👤 {student.parentName}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill variant={student.status === 'active' ? 'green' : 'red'} className="text-xs">
            {student.status}
          </StatusPill>
          {/* ═══ Payment status badge ═══ */}
          {paymentPending ? (
            <StatusPill variant="yellow" className="text-[10px]">⏳ Pending</StatusPill>
          ) : paymentOk ? (
            <StatusPill variant="green" className="text-[10px]">✅ Paid</StatusPill>
          ) : null}
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">🏫 School</span>
          <span className="font-semibold truncate ml-2">{student.schoolName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">🗓️ Batch</span>
          <span className="font-semibold">{batchLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">📱 Contact</span>
          <span className="font-semibold">{student.contact1}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">🎭 Type</span>
          <StatusPill variant={student.classType === 'offline' ? 'blue' : 'purple'} className="text-xs">
            {student.classType}
          </StatusPill>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#e8e4f0] flex items-center justify-between">
        <div>
          <div className="font-nunito text-lg font-extrabold text-primary">
            ₹{Number(student.amountPaid || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted">
            {paymentPending ? '⏳ Payment Pending' : 'First Month Paid'}
          </div>
        </div>
        <div className="flex gap-2">
          {student.currentLevel === 0 && onStartLevel && (
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onStartLevel(student.id); }}>
              🚀 Start Level
            </Button>
          )}
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onClick(student.id); }}
          >
            👁 View Details
          </Button>
        </div>
      </div>
    </div>
  );
};