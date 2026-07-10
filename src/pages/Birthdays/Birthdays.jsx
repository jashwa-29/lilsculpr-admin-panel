import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SearchBar, Button, StatusPill, Table, Modal } from '../../components/common';
import { fetchBirthdays, syncBirthdays, deleteBirthday, fetchTodayBirthdays, fetchUpcomingBirthdays } from '../../store/slices/birthdaySlice';

export const Birthdays = () => {
  const dispatch = useDispatch();
  const { birthdays, today, upcoming, isLoading } = useSelector((state) => state.birthdays);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedBirthday, setSelectedBirthday] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    dispatch(fetchBirthdays());
    dispatch(fetchTodayBirthdays());
    dispatch(fetchUpcomingBirthdays(7));
  }, [dispatch]);

  const handleSync = async () => {
    if (!window.confirm('Sync all student birthdays from their profiles? This will create/update records for all active students.')) return;
    try {
      await dispatch(syncBirthdays()).unwrap();
      alert('✅ Birthdays synced successfully!');
      dispatch(fetchBirthdays());
      dispatch(fetchTodayBirthdays());
      dispatch(fetchUpcomingBirthdays(7));
    } catch (error) {
      alert('❌ Failed to sync: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Delete this birthday record permanently?')) return;
    try {
      await dispatch(deleteBirthday(id)).unwrap();
      setShowDeleteModal(false);
      setSelectedBirthday(null);
      dispatch(fetchBirthdays());
      alert('✅ Deleted successfully');
    } catch (error) {
      alert('❌ Failed to delete: ' + error.message);
    }
  };

  const filteredBirthdays = birthdays.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = b.childName?.toLowerCase().includes(q) ||
                         b.parentName?.toLowerCase().includes(q) ||
                         b.contact1?.includes(q) ||
                         b.studentId?.enrollmentId?.toLowerCase().includes(q);
    const matchesMonth = !filterMonth || b.month === parseInt(filterMonth);
    return matchesSearch && matchesMonth;
  });

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate upcoming birthdays for display
  const getUpcomingDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date,
        month: date.getMonth() + 1,
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-IN', { weekday: 'short' })
      });
    }
    return days;
  };

  const upcomingDays = getUpcomingDays();

  const columns = [
    { key: 'student', title: 'Student' },
    { key: 'parent', title: 'Parent' },
    { key: 'dob', title: 'Date of Birth' },
    { key: 'age', title: 'Age' },
    { key: 'status', title: 'Status' },
    { key: 'action', title: 'Action' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-nunito font-extrabold">🎂 Student Birthdays</h3>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSync}>
            🔄 Sync Birthdays
          </Button>
          <Button variant="outline" onClick={() => {
            dispatch(fetchBirthdays());
            dispatch(fetchTodayBirthdays());
            dispatch(fetchUpcomingBirthdays(7));
          }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Today's Birthdays */}
      {today && today.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <h4 className="font-nunito font-bold text-yellow-800 mb-2">🎉 Today's Birthdays ({today.length})</h4>
          <div className="flex flex-wrap gap-3">
            {today.map(b => {
              const age = new Date().getFullYear() - b.year;
              return (
                <div key={b._id} className="bg-white px-4 py-2 rounded-lg shadow-sm border border-yellow-200 flex items-center gap-2">
                  <span className="font-bold text-lg">{b.childName}</span>
                  <span className="text-sm text-muted">turns <strong>{age}</strong></span>
                  <span className="text-xs text-muted">({b.parentName})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <h4 className="font-nunito font-bold text-blue-800 mb-3">📅 Upcoming Birthdays (Next 7 Days)</h4>
        <div className="space-y-2">
          {upcomingDays.map((day, idx) => {
            const dayBirthdays = upcoming.filter(b => b.month === day.month && b.day === day.day);
            return dayBirthdays.length > 0 ? (
              <div key={idx} className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-semibold text-blue-600 min-w-[120px]">
                  {day.dayName}, {day.day} {MONTHS[day.month - 1]}
                </span>
                <div className="flex flex-wrap gap-2">
                  {dayBirthdays.map(b => (
                    <span key={b._id} className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">
                      {b.childName} 
                      <span className="text-xs text-muted ml-1">
                        ({new Date().getFullYear() - b.year} years)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search student or parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="">All Months</option>
          {MONTHS.map((month, idx) => (
            <option key={idx} value={idx + 1}>{month}</option>
          ))}
        </select>
        <span className="text-xs text-muted">
          {filteredBirthdays.length} records
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={filteredBirthdays}
          isLoading={isLoading}
          emptyMessage="No birthday records found"
          renderRow={(birthday) => {
            const age = new Date().getFullYear() - birthday.year;
            const isToday = birthday.month === new Date().getMonth() + 1 && 
                           birthday.day === new Date().getDate();
            return (
              <tr key={birthday._id} className={`hover:bg-slate-50 border-b border-slate-50 last:border-b-0 ${isToday ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{birthday.childName}</div>
                  <div className="text-xs text-muted">ID: {birthday.studentId?.enrollmentId || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{birthday.parentName}</div>
                  <div className="text-xs text-muted">{birthday.contact1}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(birthday.dateOfBirth).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {isToday && <span className="ml-2 text-xs bg-yellow-200 px-2 py-0.5 rounded-full">🎂 Today!</span>}
                </td>
                <td className="px-4 py-3 text-sm font-bold">{age} years</td>
                <td className="px-4 py-3">
                  <StatusPill variant={birthday.isActive ? 'green' : 'red'}>
                    {birthday.isActive ? 'Active' : 'Inactive'}
                  </StatusPill>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedBirthday(birthday);
                        setShowDeleteModal(true);
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBirthday(null);
        }}
        title="⚠️ Delete Birthday Record"
        subtitle={`Delete birthday record for ${selectedBirthday?.childName}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowDeleteModal(false);
              setSelectedBirthday(null);
            }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDelete(selectedBirthday?._id)}>
              Delete Permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the birthday record for <strong>{selectedBirthday?.childName}</strong>?
          </p>
          <p className="text-xs text-red-600">
            ⚠️ This action cannot be undone. The record will be permanently removed from the system.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Parent:</strong> {selectedBirthday?.parentName}</p>
            <p><strong>Contact:</strong> {selectedBirthday?.contact1}</p>
            <p><strong>Date of Birth:</strong> {selectedBirthday?.dateOfBirth && new Date(selectedBirthday.dateOfBirth).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
