const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sql, poolPromise } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// API: Get all students
app.get('/api/students', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT s.student_id as id, s.full_name, s.student_code as MASV, s.date_of_birth, s.gender, s.email, s.phone, c.class_name, d.department_name, s.class_id
            FROM Students s
            LEFT JOIN Classes c ON s.class_id = c.class_id
            LEFT JOIN Major m ON c.major_id = m.major_id
            LEFT JOIN Department d ON m.department_id = d.department_id
            ORDER BY s.student_id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Add new student
app.post('/api/students', async (req, res) => {
    try {
        const { full_name, MASV, date_of_birth, gender, email, phone, class_id } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('full_name', sql.NVarChar, full_name)
            .input('student_code', sql.NVarChar, MASV)
            .input('date_of_birth', sql.DateTime2, date_of_birth ? new Date(date_of_birth) : null)
            .input('gender', sql.NVarChar, gender)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('class_id', sql.Int, class_id)
            .query(`
                EXEC sp_AddStudent @full_name, @student_code, @date_of_birth, @gender, @email, @phone, @class_id
            `);
        res.status(201).json({ message: 'Thêm sinh viên thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Update student
app.put('/api/students/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { full_name, MASV, date_of_birth, gender, email, phone, class_id } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('full_name', sql.NVarChar, full_name)
            .input('student_code', sql.NVarChar, MASV)
            .input('date_of_birth', sql.DateTime2, date_of_birth ? new Date(date_of_birth) : null)
            .input('gender', sql.NVarChar, gender)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('class_id', sql.Int, class_id)
            .query(`
                UPDATE Students 
                SET full_name = @full_name, student_code = @student_code, date_of_birth = @date_of_birth, 
                    gender = @gender, email = @email, phone = @phone, class_id = @class_id
                WHERE student_id = @id
            `);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Delete student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query('EXEC sp_DeleteStudent @student_id = @id');
            
        res.json({ message: 'Xóa sinh viên thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Grades
app.get('/api/grades', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                sc.student_score_id as id,
                s.student_code,
                s.full_name,
                co.course_name,
                cs.section_name,
                sc.score,
                sc.type_score,
                se.semester_name,
                se.year
            FROM dbo.Student_score sc
            JOIN dbo.Enrollments e ON sc.enrollment_id = e.enrollment_id
            JOIN dbo.Students s ON e.student_id = s.student_id
            JOIN dbo.Course_section cs ON e.section_id = cs.section_id
            JOIN dbo.Courses co ON cs.course_id = co.course_id
            JOIN dbo.Semester se ON cs.semester_id = se.semester_id
            ORDER BY s.student_code ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Update Grade
app.put('/api/grades/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { score } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('student_score_id', sql.Int, id)
            .input('new_score', sql.Decimal(4, 2), score)
            .query('EXEC sp_UpdateStudentScore @student_score_id, @new_score');
        res.json({ message: 'Cập nhật điểm thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Classes
app.get('/api/classes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT class_id as id, class_name FROM Classes');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
