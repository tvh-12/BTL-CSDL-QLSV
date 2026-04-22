const sql = require('mssql');
require('dotenv').config();
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true }
};
async function test() {
  try {
    const pool = await sql.connect(config);
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
    console.log(result.recordset.length > 0 ? result.recordset[0] : 'No grades');
  } catch(err) {
    console.error(err.message);
  }
  process.exit();
}
test();
