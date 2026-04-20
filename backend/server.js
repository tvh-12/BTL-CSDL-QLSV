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
