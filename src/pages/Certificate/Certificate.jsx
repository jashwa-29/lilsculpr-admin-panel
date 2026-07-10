import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents } from '../../store/slices/studentSlice';
import './Certificate.css';

const BADGES = ['🌱', '🪨', '🔶', '🔷', '⭐', '🌟', '💫', '🏅', '🥈', '🥇', '👑', '🏆'];

export const Certificate = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  const sid = searchParams.get('sid');
  const level = searchParams.get('level');
  
  const { list: students, isLoading } = useSelector(state => state.students);
  
  useEffect(() => {
    if (students.length === 0 && !isLoading) {
      dispatch(fetchStudents());
    }
  }, [dispatch, students.length, isLoading]);

  const student = useMemo(() => {
    return students.find(s => s._id === sid || s.id === sid);
  }, [students, sid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f1fa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student || !level) {
    return (
      <div className="min-h-screen bg-[#f4f1fa] flex flex-col items-center justify-center text-center p-6">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Certificate Not Found</h2>
        <p className="text-gray-500">Please access this page from the Admin Dashboard's Levels &amp; Certificates section.</p>
        <button 
          onClick={() => window.close()} 
          className="mt-6 px-6 py-2 bg-white border-2 border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
        >
          ✕ Close Window
        </button>
      </div>
    );
  }

  const lvlNum = parseInt(level, 10);
  const badgeIcon = BADGES[lvlNum - 1] || '🏅';
  const isMaster = lvlNum === 12;
  
  // The levels property is currently mocked/missing on standard Student schema.
  // Using today's date if level property is not found.
  const levelData = student.levels && student.levels[lvlNum];
  const dateObj = levelData && levelData.approvedOn ? new Date(levelData.approvedOn) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `Ref: ${(student.id || student._id).substring(0, 8).toUpperCase()}-L${lvlNum}`;

  // Update document title for printing
  document.title = `${student.childName} - Level ${lvlNum} Certificate | Lil Sculpr`;

  return (
    <div className="certificate-page">
      <div className="toolbar hide-on-print">
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
        <button className="btn btn-outline" onClick={() => window.close()}>✕ Close</button>
      </div>

      <div id="certWrap">
        <div className="cert" id="certBody">
          <div className="cert-bg-icon">🏺</div>
          <div className="cert-inner">
            <img className="cert-logo" src="https://www.lilsculpr.com/assets/img/logo.webp" alt="Lil Sculpr" />
            <div className="cert-academy">Lil Sculpr Clay Modelling Academy</div>
            <div className="cert-title">Certificate of Achievement</div>
            <div className="cert-sub">awarded for outstanding creativity and dedication</div>
            <div class="cert-presented">This certificate is proudly presented to</div>
            <div className="cert-name">{student.childName}</div>
            
            <div className="cert-desc">
              For successfully completing all requirements of <strong>Level {lvlNum}{isMaster ? ' (Master)' : ''}</strong> of the Lil Sculpr Clay Modelling curriculum, demonstrating creativity, focus, and skill in hands-on sculpting and design.
            </div>
            
            <div className="cert-badge-row">
              <div className="cert-badge">{badgeIcon}</div>
              <div className="cert-level-text">
                <div className="ln">{isMaster ? 'MASTER' : `Level ${lvlNum}`}</div>
                <div className="ld">Completed Successfully</div>
              </div>
            </div>
            
            <div className="cert-footer">
              <div className="cert-sign">
                <div className="line"></div>
                <div className="role">Instructor</div>
              </div>
              <div className="cert-meta">
                <div className="date">Issued on {dateStr}</div>
                <div className="ref">{refCode}</div>
              </div>
              <div className="cert-seal">
                <div className="seal-circle">🎖️</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
