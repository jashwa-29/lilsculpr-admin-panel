export const getSlotKey = (type, dayId, time) => `${type}|${dayId}|${time}`;

export const getSlotCount = (students, key) =>
  students.filter(s => s.slotKey === key && s.status !== 'cancelled').length;

export const getSeatsLeft = (students, key) =>
  Math.max(0, 8 - getSlotCount(students, key));

export const getBatchLabel = (student) => {
  const dayLabel = student.dayId === 'monfri' ? 'Mon/Fri'
    : student.dayId === 'tuethu' ? 'Tue/Thu'
    : 'Sat/Sun';
  return `${dayLabel} · ${student.time}`;
};

// 🔧 FIX: Use the API base URL from environment for dynamic photo URLs
export const getPhotoUrl = (student) => {
  if (!student.photo && !student.photoUrl) return '';
  
  const raw = student.photo || student.photoUrl;
  
  // If it's already a full URL (starts with http), return as-is
  if (raw.startsWith('http')) return raw;
  
  // Otherwise, prepend the API base URL
  // This ensures the photo URL works regardless of environment
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  // Remove /api from baseURL to get the server root for serving static files
  const serverURL = baseURL.replace('/api', '');
  
  // If the path already starts with /uploads, just prepend the server URL
  if (raw.startsWith('/uploads')) {
    return `${serverURL}${raw}`;
  }
  
  // Default: prepend server URL with /uploads prefix
  return `${serverURL}/uploads/${raw}`;
};

export const generateId = () =>
  'LS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

export const getMonthLabel = (date) =>
  date.toLocaleString('default', { month: 'long', year: 'numeric' });

export const getFeeKey = (studentId, month) => `${studentId}|${month}`;

// ═══ NEW: Get human-readable batch display name ═══
export const getBatchDisplayName = (batch) => {
  if (!batch) return 'Unknown Batch';
  
  const typeLabel = batch.type === 'offline' ? 'Offline' : 'Online';
  const dayLabel = batch.dayId === 'monfri' ? 'Mon & Fri'
    : batch.dayId === 'tuethu' ? 'Tue & Thu'
    : batch.dayId === 'satsu' ? 'Sat & Sun'
    : batch.dayId;
  
  return `${typeLabel} · ${dayLabel} · ${batch.time}`;
};

// ═══ NEW: Get short batch display name for filters ═══
export const getBatchShortName = (batch) => {
  if (!batch) return 'Unknown';
  
  const dayLabel = batch.dayId === 'monfri' ? 'Mon/Fri'
    : batch.dayId === 'tuethu' ? 'Tue/Thu'
    : batch.dayId === 'satsu' ? 'Sat/Sun'
    : batch.dayId;
  
  return `${dayLabel} · ${batch.time}`;
};