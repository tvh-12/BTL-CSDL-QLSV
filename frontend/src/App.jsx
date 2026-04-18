import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', MASV: '', date_of_birth: '', gender: 'Nam', email: '', phone: '', class_id: ''
  });

  // Action Menu State
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchClasses();

    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-cell')) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // --- CRUD LOGIC ---
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
    if (window.confirm("Bạn có chắc chắn muốn xóa sinh viên này?")) {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Quản Lý Sinh Viên</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Thêm Sinh Viên
        </button>
      </header>

      <main className="glass-panel">
        <h2>Danh sách Sinh viên</h2>
        {loading ? (
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
                      Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Thêm/Sửa */}
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

    </div>
  );
}

export default App;
