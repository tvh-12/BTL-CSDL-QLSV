import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal states (Students)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', MASV: '', date_of_birth: '', gender: 'Nam', email: '', phone: '', class_id: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('full_name'); // 'full_name' | 'student_code' | 'class_name'
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet

  // Modal states (Grades)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '' });

  // Action Menu State
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
      fetchClasses();
    } else if (activeTab === 'grades') {
      fetchGrades();
    } else if (activeTab === 'sections') {
      fetchSections();
    } else if (activeTab === 'statistics') {
      fetchStatistics();
    }

    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-cell')) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classes`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, class_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/grades`);
      if (res.ok) setGrades(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/sections`);
      if (res.ok) setSections(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/statistics`);
      if (res.ok) setStatistics(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setIsSearching(true);
      const params = new URLSearchParams({ [searchType]: searchQuery.trim() });
      const res = await fetch(`${API_URL}/api/students/search?${params}`);
      if (res.ok) setSearchResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // --- FILTER LOGIC ---
  const uniqueDepartments = [...new Set(students.map(s => s.department_name))].filter(Boolean);

  const toggleDepartment = (dept) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const displayedStudents = students.filter(student => {
    if (selectedDepartments.length === 0) return true;
    return selectedDepartments.includes(student.department_name);
  });

  // --- CRUD LOGIC FOR STUDENTS ---
  const handleOpenModal = (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        full_name: student.full_name,
        MASV: student.MASV,
        date_of_birth: student.date_of_birth ? student.date_of_birth.substring(0, 10) : '',
        gender: student.gender,
        email: student.email,
        phone: student.phone,
        class_id: student.class_id || (classes.length > 0 ? classes[0].id : '')
      });
    } else {
      setCurrentStudent(null);
      setFormData({
        full_name: '', MASV: '', date_of_birth: '', gender: 'Nam', email: '', phone: '', 
        class_id: classes.length > 0 ? classes[0].id : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentStudent 
      ? `${API_URL}/api/students/${currentStudent.id}` 
      : `${API_URL}/api/students`;
    
    const method = currentStudent ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchStudents();
      } else {
        alert("Có lỗi xảy ra khi lưu dữ liệu");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sinh viên này? Toàn bộ điểm và môn học đăng ký của sinh viên này cũng sẽ bị xóa.")) {
      try {
        const res = await fetch(`${API_URL}/api/students/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchStudents();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIC FOR GRADES ---
  const handleOpenGradeModal = (grade) => {
    setCurrentGrade(grade);
    setGradeForm({ score: grade.score !== null ? grade.score : '' });
    setIsGradeModalOpen(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/grades/${currentGrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: gradeForm.score })
      });
      if (res.ok) {
        setIsGradeModalOpen(false);
        fetchGrades();
      } else {
        alert("Có lỗi xảy ra khi cập nhật điểm");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-logo">
          <svg className="header-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <h2>MENU</h2>
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Hồ sơ Sinh viên
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Quản lý Điểm số
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          Danh Sách Học Phần
        </div>

        <div 
          className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          Thống Kê Điểm (GPA)
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <header className="header">
          <div className="header-title">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}
            >
              <svg 
                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span>
              {activeTab === 'students' && 'Hồ Sơ Sinh Viên'}
              {activeTab === 'grades' && 'Bảng Điểm Môn Học'}
              {activeTab === 'sections' && 'Danh Sách Học Phần'}
              {activeTab === 'statistics' && 'Thống Kê Điểm Trung Bình'}
            </span>
          </div>
          {activeTab === 'students' && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm Sinh Viên
            </button>
          )}
        </header>

        <div className="glass-panel">
          {activeTab === 'students' && (
            <>
              {/* SEARCH BAR */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  value={searchType}
                  onChange={e => { setSearchType(e.target.value); setSearchResults(null); }}
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', minWidth: '150px' }}
                >
                  <option value="full_name">Tìm theo Tên</option>
                  <option value="student_code">Tìm theo Mã SV</option>
                  <option value="class_name">Tìm theo Lớp</option>
                </select>
                <input
                  type="text"
                  placeholder={searchType === 'full_name' ? 'Nhập họ tên...' : searchType === 'student_code' ? 'Nhập mã sinh viên...' : 'Nhập tên lớp...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', outline: 'none', minWidth: '200px' }}
                />
                <button onClick={handleSearch} disabled={isSearching} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                  {isSearching ? 'Đang tìm...' : '🔍 Tìm kiếm'}
                </button>
                {searchResults !== null && (
                  <button onClick={handleClearSearch} className="btn btn-outline" style={{ padding: '10px 16px' }}>✕ Xoá</button>
                )}
              </div>

              {searchResults !== null ? (
                <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                  <p style={{ marginBottom: '12px', color: 'var(--text-light)', fontSize: '14px' }}>
                    Tìm thấy <strong style={{ color: 'var(--primary)' }}>{searchResults.length}</strong> kết quả
                  </p>
                  <table>
                    <thead><tr><th>Mã SV</th><th>Họ và Tên</th><th>Giới tính</th><th>Lớp</th></tr></thead>
                    <tbody>
                      {searchResults.length > 0 ? searchResults.map((s, i) => (
                        <tr key={i}>
                          <td><strong style={{ color: 'var(--primary)' }}>{s.student_code}</strong></td>
                          <td>{s.full_name}</td><td>{s.gender}</td><td>{s.class_name}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Không tìm thấy sinh viên nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : loading ? (
                <div className="loader">Đang tải dữ liệu...</div>
              ) : (
                <div style={{ overflowX: 'auto', minHeight: '400px', paddingBottom: '100px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và Tên</th>
                        <th>Giới tính</th>
                        <th>Ngày sinh</th>
                        <th>Lớp</th>
                        <th style={{ position: 'relative' }}>
                          <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }} 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                          >
                            Khoa
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: selectedDepartments.length > 0 ? 'var(--primary)' : 'inherit' }}>
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            {selectedDepartments.length > 0 && (
                              <span style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px' }}>
                                {selectedDepartments.length}
                              </span>
                            )}
                          </div>
                          {isFilterOpen && (
                            <div className="filter-dropdown">
                              {uniqueDepartments.map(dept => (
                                <label key={dept} className="filter-option">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedDepartments.includes(dept)}
                                    onChange={() => toggleDepartment(dept)}
                                  />
                                  {dept}
                                </label>
                              ))}
                            </div>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStudents.length > 0 ? (
                        displayedStudents.map(student => (
                          <tr key={student.id}>
                            <td><strong style={{ color: 'var(--primary)' }}>{student.MASV}</strong></td>
                            <td>{student.full_name}</td>
                            <td>{student.gender}</td>
                            <td>{formatDate(student.date_of_birth)}</td>
                            <td>{student.class_name}</td>
                            <td style={{ position: 'relative', minWidth: '160px' }} className="action-cell">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{student.department_name}</span>
                                <button 
                                  className="btn-icon" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionId(activeActionId === student.id ? null : student.id);
                                  }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px', transition: 'color 0.2s', display: 'flex' }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeActionId === student.id && (
                                <div className="action-dropdown" style={{ right: '10px', top: '100%', transform: 'none', marginTop: '4px' }}>
                                  <button className="action-item" onClick={() => { handleOpenModal(student); setActiveActionId(null); }}>
                                    Sửa thông tin
                                  </button>
                                  <button className="action-item danger" onClick={() => { handleDelete(student.id); setActiveActionId(null); }}>
                                    Xóa sinh viên
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                            Không tìm thấy sinh viên nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'grades' && (
            <>
              {loading ? (
                <div className="loader">Đang tải bảng điểm...</div>
              ) : (
                <div style={{ overflowX: 'auto', minHeight: '400px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và Tên</th>
                        <th>Môn học</th>
                        <th>Học phần</th>
                        <th>Kỳ học</th>
                        <th>Loại điểm</th>
                        <th>Điểm số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((grade, index) => (
                        <tr key={grade.id || index}>
                          <td><strong style={{ color: 'var(--primary)' }}>{grade.student_code}</strong></td>
                          <td>{grade.full_name}</td>
                          <td>{grade.course_name}</td>
                          <td>{grade.section_name}</td>
                          <td>{grade.semester_name} - {grade.year}</td>
                          <td>
                            <span style={{
                              background: grade.type_score === 'midterm' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: grade.type_score === 'midterm' ? '#34d399' : '#fbbf24',
                              padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600'
                            }}>
                              {grade.type_score === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}
                            </span>
                          </td>
                          <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ 
                              color: grade.score !== null ? (grade.score >= 5 ? '#34d399' : '#ef4444') : 'var(--text-light)',
                              fontSize: '16px'
                            }}>
                              {grade.score !== null ? grade.score : '-'}
                            </strong>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleOpenGradeModal(grade)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'sections' && (
            <>
              {loading ? (
                <div className="loader">Đang tải danh sách học phần...</div>
              ) : (
                <div style={{ overflowX: 'auto', minHeight: '400px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tên Học Phần</th>
                        <th>Môn Học</th>
                        <th>Tín chỉ</th>
                        <th>Giảng Viên Phụ Trách</th>
                        <th>Kỳ học</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((sec, index) => (
                        <tr key={sec.section_id || index}>
                          <td><strong style={{ color: 'var(--primary)' }}>{sec.section_name}</strong></td>
                          <td>{sec.course_name}</td>
                          <td><span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>{sec.credits}</span></td>
                          <td><strong style={{ color: '#00f2fe' }}>{sec.teacher_name}</strong></td>
                          <td>{sec.semester_name} - {sec.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'statistics' && (
            <>
              {loading ? (
                <div className="loader">Đang tải dữ liệu thống kê...</div>
              ) : (
                <div style={{ overflowX: 'auto', minHeight: '400px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và Tên</th>
                        <th>Môn Học</th>
                        <th>Điểm Trung Bình (GPA)</th>
                        <th>Xếp Loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.map((stat, index) => {
                        let color = '';
                        let text = '';
                        let bg = '';
                        if (stat.average_gpa >= 8.0) { color = '#10b981'; text = 'Giỏi'; bg = 'rgba(16, 185, 129, 0.1)'; }
                        else if (stat.average_gpa >= 6.5) { color = '#3b82f6'; text = 'Khá'; bg = 'rgba(59, 130, 246, 0.1)'; }
                        else if (stat.average_gpa >= 5.0) { color = '#f59e0b'; text = 'Trung Bình'; bg = 'rgba(245, 158, 11, 0.1)'; }
                        else { color = '#ef4444'; text = 'Yếu'; bg = 'rgba(239, 68, 68, 0.1)'; }
                        
                        return (
                          <tr key={index}>
                            <td><strong style={{ color: 'var(--primary)' }}>{stat.student_code}</strong></td>
                            <td>{stat.full_name}</td>
                            <td>{stat.course_name}</td>
                            <td>
                              <strong style={{ fontSize: '18px', color: color }}>
                                {stat.average_gpa}
                              </strong>
                            </td>
                            <td>
                              <span style={{
                                background: bg,
                                color: color,
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '700'
                              }}>
                                {text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Thêm/Sửa Sinh Viên */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '24px' }}>{currentStudent ? 'Cập nhật Sinh viên' : 'Thêm Sinh viên mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã Sinh Viên</label>
                  <input required className="form-control" name="MASV" value={formData.MASV} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Họ và Tên</label>
                  <input required className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input type="date" className="form-control" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select className="form-control" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group full-width">
                  <label>Lớp học</label>
                  <select required className="form-control" name="class_id" value={formData.class_id} onChange={handleChange}>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Điểm */}
      {isGradeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '24px' }}>Cập nhật Điểm số</h2>
            <div style={{ marginBottom: '20px', color: 'var(--text-light)', fontSize: '14px' }}>
              <p>Sinh viên: <strong style={{ color: 'var(--text-dark)' }}>{currentGrade?.full_name}</strong></p>
              <p>Môn học: <strong style={{ color: 'var(--text-dark)' }}>{currentGrade?.course_name}</strong></p>
              <p>Loại điểm: <strong style={{ color: 'var(--text-dark)' }}>{currentGrade?.type_score === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}</strong></p>
            </div>
            <form onSubmit={handleGradeSubmit}>
              <div className="form-group full-width" style={{ marginBottom: '24px' }}>
                <label>Nhập điểm số mới (0 - 10)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  required 
                  className="form-control" 
                  value={gradeForm.score} 
                  onChange={(e) => setGradeForm({ score: e.target.value })} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsGradeModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
