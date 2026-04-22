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
                sc.id as id,
                s.MASV as student_code,
                s.full_name,
                co.course_name,
                cs.section_name,
                sc.score,
                'Cuối kỳ' as type_score,
                se.semester_name,
                se.year
            FROM dbo.Student_score sc
            JOIN dbo.Enrollments e ON sc.enrollment_id = e.id
            JOIN dbo.Students s ON e.student_id = s.id
            JOIN dbo.Course_section cs ON e.section_id = cs.id
            JOIN dbo.Courses co ON cs.course_id = co.id
            JOIN dbo.Semester se ON cs.semester_id = se.id
            ORDER BY s.MASV ASC
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
            .input('id', sql.Int, id)
            .input('new_score', sql.Decimal(4, 2), score)
            .query('UPDATE Student_score SET score = @new_score WHERE id = @id');
        res.json({ message: 'Cập nhật điểm thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Course Sections
app.get('/api/sections', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                cs.id as section_id,
                cs.section_name,
                c.course_name,
                3 as credits,
                t.name as teacher_name,
                se.semester_name,
                se.year
            FROM dbo.Course_section cs
            JOIN dbo.Courses c ON cs.course_id = c.id
            JOIN dbo.Teachers t ON cs.teacher_id = t.id
            JOIN dbo.Semester se ON cs.semester_id = se.id
            ORDER BY se.year DESC, se.semester_name ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get GPA Statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.MASV as student_code,
                s.full_name,
                c.course_name,
                CAST(AVG(sc.score) AS DECIMAL(4,2)) AS average_gpa
            FROM dbo.Students s
            JOIN dbo.Enrollments e ON s.id = e.student_id
            JOIN dbo.Student_score sc ON e.id = sc.enrollment_id
            JOIN dbo.Course_section cs ON e.section_id = cs.id
            JOIN dbo.Courses c ON cs.course_id = c.id
            GROUP BY 
                s.MASV,
                s.full_name,
                c.course_name
            ORDER BY s.MASV ASC
        `);
        res.json(result.recordset);
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
