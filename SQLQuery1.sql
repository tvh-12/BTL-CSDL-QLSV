
USE QLSV;
GO

DROP PROCEDURE IF EXISTS sp_AddStudent;
DROP PROCEDURE IF EXISTS sp_EnrollStudent;
DROP PROCEDURE IF EXISTS sp_UpdateScore;
DROP PROCEDURE IF EXISTS sp_GetStudentGrades;
DROP PROCEDURE IF EXISTS sp_DeleteStudent;
DROP VIEW IF EXISTS dbo.v_StudentGrades;
DROP VIEW IF EXISTS dbo.v_CourseSectionDetails;
DROP VIEW IF EXISTS dbo.v_StudentProfiles;
DROP TABLE IF EXISTS Student_score;
DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Course_section;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Major_course;
DROP TABLE IF EXISTS Major;
DROP TABLE IF EXISTS Teachers;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Semester;
DROP TABLE IF EXISTS Department;

-- 1. Tao bang khoa
CREATE TABLE Department (
    department_id INT PRIMARY KEY IDENTITY(1,1),
    department_name NVARCHAR(50) NOT NULL
);

-- 2. Tao bang giang vien
CREATE TABLE Teachers (
    teacher_id INT PRIMARY KEY IDENTITY(1,1),
    teacher_code NVARCHAR(50) NOT NULL,
    full_name NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    department_id INT NOT NULL FOREIGN KEY REFERENCES Department(department_id)
);

-- 3. Tao bang mon hoc
CREATE TABLE Courses (
    course_id INT PRIMARY KEY IDENTITY(1,1),
    course_name NVARCHAR(50) NOT NULL,
    credits INT
);

-- 4. Tao bang hoc ky semester
CREATE TABLE Semester (
    semester_id INT PRIMARY KEY IDENTITY(1,1),
    semester_name NVARCHAR(20) NOT NULL CHECK (semester_name IN (N'HK1', N'HK2', N'HK3')),
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    UNIQUE(semester_name, year)
);

-- 5. Tao bang chuyen nganh
CREATE TABLE Major (
    major_id INT PRIMARY KEY IDENTITY(1,1),
    major_name NVARCHAR(50) NOT NULL,
    department_id INT NOT NULL FOREIGN KEY REFERENCES Department(department_id)
);

-- 6. Tao bang lop
CREATE TABLE Classes (
    class_id INT PRIMARY KEY IDENTITY(1,1),
    class_name NVARCHAR(50) NOT NULL UNIQUE,
    major_id INT NOT NULL FOREIGN KEY REFERENCES Major(major_id)
);

-- 7. Tao bang sinh vien
CREATE TABLE Students (
    student_id INT PRIMARY KEY IDENTITY(1,1),
    full_name NVARCHAR(255) NOT NULL,
    student_code NVARCHAR(50) UNIQUE,
    date_of_birth DATE,
    gender NVARCHAR(10) CHECK (gender IN (N'Nam', N'Nu')),
    email NVARCHAR(100) UNIQUE,
    phone NVARCHAR(20) UNIQUE,
    class_id INT NOT NULL FOREIGN KEY REFERENCES Classes(class_id)
);

-- 8. Tao bảng hoc phan (Lop hoc theo ky)
CREATE TABLE Course_section (
    section_id INT PRIMARY KEY IDENTITY(1,1),
    section_name NVARCHAR(20),
    course_id INT NOT NULL FOREIGN KEY REFERENCES Courses(course_id),
    teacher_id INT NOT NULL FOREIGN KEY REFERENCES Teachers(teacher_id),
    semester_id INT NOT NULL FOREIGN KEY REFERENCES Semester(semester_id),
    UNIQUE(section_name, course_id, semester_id)
);

-- 9. Tao bang dang ky mon
CREATE TABLE Enrollments (
    enrollment_id INT PRIMARY KEY IDENTITY(1,1),
    student_id INT NOT NULL FOREIGN KEY REFERENCES Students(student_id),
    section_id INT NOT NULL FOREIGN KEY REFERENCES Course_section(section_id),
    UNIQUE(student_id, section_id)
);

--10. Tao bang bang diem sinh vien
CREATE TABLE Student_score (
    student_score_id  INT PRIMARY KEY IDENTITY(1,1),
    score DECIMAL(4,2) CHECK (score >= 0 AND score <= 10),
    type_score nvarchar(10) CHECK (type_score IN (N'midterm', N'final')), 
    enrollment_id INT NOT NULL FOREIGN KEY REFERENCES Enrollments(enrollment_id),
    UNIQUE(enrollment_id, type_score)
);

-- 11 Tao bang nganh hoc mon hoc
CREATE TABLE Major_course(
    major_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY(major_id, course_id),
    FOREIGN KEY (major_id) REFERENCES Major(major_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);
GO

-- 12 Tao bang view cho studentProfile
CREATE VIEW v_StudentProfiles AS
SELECT 
    s.student_id,
    s.student_code,
    s.full_name,
    s.date_of_birth,
    s.gender,
    s.email,
    c.class_name,
    m.major_name,
    d.department_name
FROM Students s
JOIN Classes c ON s.class_id = c.class_id
JOIN Major m ON c.major_id = m.major_id
JOIN Department d ON m.department_id = d.department_id;
GO

-- 13 Tao bang view chi tiet học phan
CREATE VIEW v_CourseSectionDetails AS
SELECT 
    cs.section_id AS section_id,
    cs.section_name,
    co.course_name,
    co.credits,
    t.full_name AS teacher_name,
    se.semester_name,
    se.year
FROM Course_section cs
JOIN Courses co ON cs.course_id = co.course_id
JOIN Teachers t ON cs.teacher_id = t.teacher_id
JOIN Semester se ON cs.semester_id = se.semester_id;
GO

-- 14 View bang diem chi tiet
CREATE VIEW dbo.v_StudentGrades AS
SELECT 
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
JOIN dbo.Semester se ON cs.semester_id = se.semester_id;
GO

-- 15 Tao Procedure them sinh vien
CREATE PROCEDURE sp_AddStudent
    @full_name NVARCHAR(255),
    @student_code NVARCHAR(50), -- Changed from @MASV
    @date_of_birth DATE,
    @gender NVARCHAR(10),
    @email NVARCHAR(100),
    @phone NVARCHAR(20),
    @class_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO Students(full_name, student_code, date_of_birth, gender, email, phone, class_id)
        VALUES (@full_name, @student_code, @date_of_birth, @gender, @email, @phone, @class_id);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 16 Tao Procedure dang ky mon
CREATE PROCEDURE sp_EnrollStudent
    @student_id INT,
    @section_id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF EXISTS (
            SELECT 1 
            FROM Enrollments 
            WHERE student_id = @student_id 
              AND section_id = @section_id
        )
        BEGIN
            THROW 50001, N'Da dang ky!', 1;
        END

        INSERT INTO Enrollments(student_id, section_id)
        VALUES (@student_id, @section_id);

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 17 Tao Procedure cap nhat diem cua sinh vien
CREATE PROCEDURE sp_UpdateScore
    @enrollment_id INT,
    @type_score NVARCHAR(10),
    @new_score DECIMAL(4,2)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        UPDATE Student_score
        SET score = @new_score
        WHERE enrollment_id = @enrollment_id 
          AND type_score = @type_score;

        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50002, N'Khong tim thay!', 1;
        END

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 18 Tao Procedure xem diem cua sinh vien
CREATE PROCEDURE sp_GetStudentGrades
    @student_code NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM v_StudentGrades
    WHERE student_code = @student_code -- Matches the column name in the View
    ORDER BY year DESC, semester_name DESC;
END;
GO

-- 19 Xoa sinh vien
CREATE PROCEDURE sp_DeleteStudent
    @student_id INT
AS
BEGIN
    -- xoa diem
    DELETE FROM Student_score
    WHERE enrollment_id IN (
        SELECT enrollment_id FROM Enrollments WHERE student_id = @student_id
    );

    -- xoa dang ky
    DELETE FROM Enrollments
    WHERE student_id = @student_id;

    -- xoa sinh vien
    DELETE FROM Students
    WHERE student_id = @student_id;
END;
GO