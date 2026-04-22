--File script SQL (.sql): Bao gồm lệnh tạo CSDL, bảng, view, index, stored procedure, dữ liệu mẫu.

-- TẠO DATABASE
IF DB_ID('QLSV') IS NULL
    CREATE DATABASE QLSV;
GO

USE QLSV;
GO

-- TẠO BẢNG
DROP PROCEDURE IF EXISTS sp_AddStudent;
DROP PROCEDURE IF EXISTS sp_UpdateStudentScore;
DROP PROCEDURE IF EXISTS sp_DeleteStudent;
DROP PROCEDURE IF EXISTS sp_SearchStudents;
DROP VIEW IF EXISTS dbo.vw_CompletedClassesView;
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

-- TẠO BẢNG VIEW

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

-- 15 View diem trung binh
CREATE VIEW vw_CompletedClassesView AS
SELECT 
    cs.course_id,
    crs.course_name AS subject, 
    s.student_id,
    CAST(AVG(sc.score) AS DECIMAL(4,2)) AS average_gpa
FROM Course_section cs
INNER JOIN Courses crs ON cs.course_id = crs.course_id
INNER JOIN Enrollments e ON cs.section_id = e.section_id
INNER JOIN Students s ON e.student_id = s.student_id
INNER JOIN Student_score sc ON e.enrollment_id = sc.enrollment_id
GROUP BY 
    cs.course_id,
    crs.course_name,
    s.student_id;
GO

-- TẠO PROCEDURE

-- 16 Tao Procedure tiep nhan sinh vien moi
CREATE PROCEDURE sp_AddStudent
    @full_name NVARCHAR(255),
    @student_code NVARCHAR(50),
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
        ;THROW;
    END CATCH
END;
GO

-- 17 Cap nhat va dieu chinh diem so
CREATE PROCEDURE sp_UpdateStudentScore
    @student_score_id INT,
    @new_score DECIMAL(4,2)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        UPDATE Student_score
        SET score = @new_score
        WHERE student_score_id = @student_score_id;

        IF (@@ROWCOUNT = 0)
        BEGIN
            ;THROW 50002, N'Khong tim thay!', 1;
        END

    END TRY
    BEGIN CATCH
        ;THROW; 
    END CATCH
END;
GO

-- 18 Xoa bo du lieu sinh vien
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

-- 19 Tra cuu thong tin
CREATE PROCEDURE sp_SearchStudents
    @student_code NVARCHAR(50) = NULL,
    @full_name NVARCHAR(255) = NULL,
    @class_name NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.student_code, 
        s.full_name, 
        s.gender, 
        c.class_name
    FROM Students s
    INNER JOIN Classes c ON s.class_id = c.class_id
    WHERE 
        (@student_code IS NULL OR s.student_code = @student_code)
        AND (@full_name IS NULL OR s.full_name LIKE '%' + @full_name + '%')
        AND (@class_name IS NULL OR c.class_name = @class_name);
END;
GO

-- 20 Tao Index
CREATE INDEX IX_Students_FullName ON Students(full_name);
CREATE INDEX IX_Students_ClassID ON Students(class_id);
CREATE INDEX IX_Enrollments_StudentID ON Enrollments(student_id);
CREATE INDEX IX_Enrollments_SectionID ON Enrollments(section_id);
CREATE INDEX IX_CourseSection_CourseID ON Course_section(course_id);

-- CHEN DU LIEU MAU

INSERT INTO Department (department_name) VALUES
(N'Vien thong'),
(N'Dien tu'),
(N'Cong nghe thong tin'),
(N'An toan thong tin'),
(N'Quan tri kinh doanh'),
(N'Tai chinh'),
(N'Marketing'),
(N'Ke toan'),
(N'Bao chi truyen thong'),
(N'Ngoai ngu');

INSERT INTO Teachers (teacher_code, full_name, email, department_id) VALUES
('KVT001', N'Nguyen Van An', 'an.nguyen@ptit.edu.vn', 1),
('KVT002', N'Hoang Van Khoa', 'em.hoang@ptit.edu.vn', 1),
('KDT001', N'Tran Thi Binh', 'binh.tran@ptit.edu.vn', 2),
('KDT002', N'Do Van Kien', 'kien.do@ptit.edu.vn', 2),
('KCN001', N'Le Van Cuong', 'cuong.le@ptit.edu.vn', 3),
('KCN002', N'Pham Thi Dung', 'dung.pham@ptit.edu.vn', 3),
('KCN003', N'Phan Van Nam', 'nam.phan@ptit.edu.vn', 3),
('KAT001', N'Vu Thi Hoa', 'hoa.vu@ptit.edu.vn', 4),
('KAT002', N'Dang Thi Oanh', 'oanh.dang@ptit.edu.vn', 4),
('KQT001', N'Bui Thi Lan', 'lan.bui@ptit.edu.vn', 5),
('KQT002', N'Nguyen Van Phuong', 'phuong.nguyen@ptit.edu.vn', 5),
('KTC001', N'Tran Van Quyet', 'quyet.tran@ptit.edu.vn', 6),
('KTC002', N'Le Thi Sao', 'sao.le@ptit.edu.vn', 6),
('KMT001', N'Pham Van Tam', 'tam.pham@ptit.edu.vn', 7),
('KMT002', N'Hoang Thi Uyên', 'uyen.hoang@ptit.edu.vn', 7),
('KKT001', N'Vu Van Viet', 'viet.vu@ptit.edu.vn', 8),
('KKT002', N'Do Thi Xuan', 'xuan.do@ptit.edu.vn', 8),
('KBC001', N'Bui Van Yen', 'yen.bui@ptit.edu.vn', 9),
('KBC002', N'Phan Thi Anh', 'anh.phan@ptit.edu.vn', 9),
('KNN001', N'Dang Van Binh', 'binh.dang@ptit.edu.vn', 10),
('KNN002', N'Nguyen Thi Chinh', 'chinh.nguyen@ptit.edu.vn', 10);

INSERT INTO Courses (course_name, credits) VALUES
(N'Co so vien thong', 3),
(N'Truyen dan so', 3),
(N'Mang vien thong', 3),
(N'Ky thuat thong tin quang', 3),
(N'He thong thong tin di dong', 3),
(N'Mach dien tu co ban', 3),
(N'Dien tu so', 3),
(N'Vi xu ly', 4),
(N'He thong nhung', 4),
(N'Thiet ke mach', 4),
(N'Lap trinh C', 2),
(N'Lap trinh Java', 3),
(N'Co so du lieu', 3),
(N'Cau truc du lieu va giai thuat', 3),
(N'Lap trinh web', 3),
(N'He dieu hanh', 3),
(N'Ma hoa thong tin', 3),
(N'Bao mat mang', 3),
(N'An toan he thong', 3),
(N'Kiem thu bao mat', 3),
(N'Quan tri hoc', 3),
(N'Kinh te vi mo', 2),
(N'Quan tri nhan su', 2),
(N'Marketing can ban', 2);

INSERT INTO Major (major_name, department_id) VALUES
(N'Dien tu vien thong', 1),
(N'Dien-Dien tu', 2),
(N'Cong nghe thong tin', 3),
(N'An toan thong tin', 4),
(N'Quan tri kinh doanh', 5),
(N'Tai chinh doanh nghiep', 6),
(N'Marketing so', 7),
(N'Ke toan doanh nghiep', 8),
(N'Bao chi', 9),
(N'Ngon ngu Anh', 10);

INSERT INTO Classes (class_name, major_id) VALUES
(N'D24CQVT01-B', 1),
(N'D24CQVT02-B', 1),
(N'D24CQDT01-B', 2),
(N'D24CQDT02-B', 2),
(N'D24CQCN01-B', 3),
(N'D24CQCN2-B', 3),
(N'D24CQCN03-B', 3),
(N'D24CQAT01-B', 4),
(N'D24CQAT02-B', 4),
(N'D24CQQT01-B', 5),
(N'D24CQQT02-B', 5),
(N'D24CQTC01-B', 6),
(N'D24CQTC02-B', 6),
(N'D24CQMR01-B', 7),
(N'D24CQMR02-B', 7),
(N'D24CQKT01-B', 8),
(N'D24CQKT02-B', 8),
(N'D24CQBC01-B', 9),
(N'D24CQBC02-B', 9),
(N'D24CQNN01-B', 10),
(N'D24CQNN02-B', 10);

INSERT INTO Students (student_code, full_name, date_of_birth, gender, email, phone, class_id)
VALUES
-- Dien tu vien thong
('B24DCVT001', N'Nguyen Hoang Nam', '2006-01-01', N'Nam', 'nam.nh@ptit.edu.vn', '0900000001', 1),
('B24DCVT002', N'Tran Minh Quan', '2006-02-02', N'Nam', 'quan.tm@ptit.edu.vn', '0900000002', 1),
('B24DCVT003', N'Le Khanh Huyen', '2006-03-03', N'Nu',  'huyen.lk@ptit.edu.vn', '0900000003', 1),
('B24DCVT004', N'Pham Gia Bao', '2006-04-04', N'Nam', 'bao.pg@ptit.edu.vn', '0900000004', 1),
('B24DCVT005', N'Hoang Thu Thao','2006-05-05', N'Nu',  'thao.ht@ptit.edu.vn', '0900000005', 1),
('B24DCVT006', N'Nguyen Duc Anh', '2006-01-01', N'Nam', 'anh.nd@ptit.edu.vn', '0900000006', 2),
('B24DCVT007', N'Tran The Vinh', '2006-02-02', N'Nam', 'vinh.tt@ptit.edu.vn', '0900000007', 2),
('B24DCVT008', N'Le Minh Anh', '2006-03-03', N'Nu',  'anh.lm@ptit.edu.vn', '0900000008', 2),
('B24DCVT009', N'Pham Tien Dung', '2006-04-04', N'Nam', 'dung.pt@ptit.edu.vn', '0900000009', 2),
('B24DCVT010', N'Hoang Bao Ngoc','2006-05-05', N'Nu',  'ngoc.hb@ptit.edu.vn', '0900000010', 2),

-- Dien - Dien tu
('B24DCDT001', N'Nguyen Huu Tho', '2006-01-01', N'Nam', 'tho.nh@ptit.edu.vn', '1900000001', 3),
('B24DCDT002', N'Tran My Linh',  '2006-02-02', N'Nu',  'linh.tm@ptit.edu.vn',   '1900000002', 3),
('B24DCDT003', N'Le Van Thang',    '2006-03-03', N'Nam', 'thang.lv@ptit.edu.vn',     '1900000003', 3),
('B24DCDT004', N'Pham Thanh Ha',  '2006-04-04', N'Nu',  'ha.pt@ptit.edu.vn',   '1900000004', 3),
('B24DCDT005', N'Hoang Quoc Viet', '2006-05-05', N'Nam', 'viet.hq@ptit.edu.vn',  '1900000005', 4),
('B24DCDT006', N'Do Thi Dieu',    '2006-06-06', N'Nu',  'dieu.dt@ptit.edu.vn',     '1900000006', 4),
('B24DCDT007', N'Vu Quang Huy',    '2006-07-07', N'Nam', 'huy.vq@ptit.edu.vn',     '1900000007', 4),
('B24DCDT008', N'Bui Phuong Mai',   '2006-08-08', N'Nu',  'mai.bp@ptit.edu.vn',    '1900000008', 4),
('B24DCDT009', N'Nguyen Dinh Trong','2006-09-09', N'Nam', 'trong.nd@ptit.edu.vn', '1900000009', 4),

-- Cong nghe thong tin
('B24DCCN001', N'Nguyen Tuan Kiet', '2006-01-01', N'Nam', 'kiet.nt@ptit.edu.vn', '0910000001', 5),
('B24DCCN002', N'Tran Thu Trang',   '2006-02-02', N'Nu',  'trang.tt@ptit.edu.vn',   '0910000002', 5),
('B24DCCN003', N'Le Manh Hung',     '2006-03-03', N'Nam', 'hung.lm@ptit.edu.vn',     '0910000003', 5),
('B24DCCN004', N'Pham Ngoc Diep',   '2006-04-04', N'Nu',  'diep.pn@ptit.edu.vn',   '0910000004', 5),
('B24DCCN005', N'Hoang Cong Vinh',  '2006-05-05', N'Nam', 'vinh.hc@ptit.edu.vn',  '0910000005', 5),
('B24DCCN006', N'Nguyen Duy Manh', '2006-06-06', N'Nam', 'manh.nd@ptit.edu.vn', '0910000006', 6),
('B24DCCN007', N'Tran Huong Giang',   '2006-07-07', N'Nu',  'giang.th@ptit.edu.vn',   '0910000007', 6),
('B24DCCN008', N'Le Tung Duong',     '2006-08-08', N'Nam', 'duong.lt@ptit.edu.vn',     '0910000008', 6),
('B24DCCN009', N'Pham Minh Thu',   '2006-09-09', N'Nu',  'thu.pm@ptit.edu.vn',   '0910000009', 6),
('B24DCCN010', N'Hoang Anh Tuan',  '2006-10-10', N'Nam', 'tuan.ha@ptit.edu.vn',  '0910000010', 6),
('B24DCCN011', N'Nguyen Thanh Son', '2006-11-11', N'Nam', 'son.nt@ptit.edu.vn', '0910000011', 7),
('B24DCCN012', N'Tran Bao Tram',   '2006-12-12', N'Nu',  'tram.tb@ptit.edu.vn',   '0910000012', 7),
('B24DCCN013', N'Le Xuan Bac',     '2006-01-13', N'Nam', 'bac.lx@ptit.edu.vn',     '0910000013', 7),
('B24DCCN014', N'Pham Quynh Anh',   '2006-02-14', N'Nu',  'anh.pq@ptit.edu.vn',   '0910000014', 7),
('B24DCCN015', N'Hoang Minh Hieu',  '2006-03-15', N'Nam', 'hieu.hm@ptit.edu.vn',  '0910000015', 7),

-- An toan thong tin
('B24DCAT001', N'Nguyen Trong Dai', '2006-01-01', N'Nam', 'dai.nt@ptit.edu.vn', '090100001', 8),
('B24DCAT002', N'Tran Thuy Chi',   '2006-02-02', N'Nu',  'chi.tt@ptit.edu.vn',   '090100002', 8),
('B24DCAT003', N'Le Thai Son',     '2006-03-03', N'Nam', 'son.lt@ptit.edu.vn',     '090100003', 8),
('B24DCAT004', N'Nguyen Van Thanh', '2006-04-04', N'Nam', 'thanh.nv@ptit.edu.vn', '090100004', 9),
('B24DCAT005', N'Tran Yen Vy',   '2006-05-05', N'Nu',  'vy.ty@ptit.edu.vn',   '090100005', 9),
('B24DCAT006', N'Le Hoang Long',     '2006-06-06', N'Nam', 'long.lh@ptit.edu.vn',     '090100006', 9),

-- Quan tri kinh doanh
('D24CQQT001', N'Nguyen Anh Dung', '2006-01-01', N'Nam', 'dung.na@ptit.edu.vn', '090110001', 10),
('D24CQQT002', N'Tran Mai Anh', '2006-02-15', N'Nu', 'anh.tm@ptit.edu.vn', '090110002', 10),
('D24CQQT003', N'Le Quoc Khanh', '2006-03-20', N'Nam', 'khanh.lq@ptit.edu.vn', '090110003', 10),
('D24CQQT004', N'Pham Bich Ngoc', '2006-04-10', N'Nu', 'ngoc.pb@ptit.edu.vn', '090110004', 11),
('D24CQQT005', N'Hoang Nhat Minh', '2006-05-05', N'Nam', 'minh.hn@ptit.edu.vn', '090110005', 11),
('D24CQQT006', N'Vu Minh Tuyet', '2006-06-18', N'Nu', 'tuyet.vm@ptit.edu.vn', '090110006', 11),

-- Tai chinh doanh nghiep
('D24CQTC001', N'Nguyen Hong Quan', '2006-01-01', N'Nam', 'quan.nh@ptit.edu.vn', '190110001', 12),
('D24CQTC002', N'Tran Kim Ngan', '2006-02-02', N'Nu', 'ngan.tk@ptit.edu.vn', '190110002', 12),
('D24CQTC003', N'Le Thanh Dat', '2006-03-03', N'Nam', 'dat.lt@ptit.edu.vn', '190110003', 12),
('D24CQTC004', N'Pham Minh Hanh', '2006-04-04', N'Nu', 'hanh.pm@ptit.edu.vn', '190110004', 13),
('D24CQTC005', N'Hoang The Anh', '2006-05-05', N'Nam', 'anh.ht@ptit.edu.vn', '190110005', 13),
('D24CQTC006', N'Vu Kieu Oanh', '2006-06-06', N'Nu', 'oanh.vk@ptit.edu.vn', '190110006', 13),

-- Marketing
('D24CQMR001', N'Nguyen Khanh Linh', '2006-01-01', N'Nam', 'linh.nk@ptit.edu.vn', '191110001', 14),
('D24CQMR002', N'Tran Thu Thuy', '2006-02-02', N'Nu', 'thuy.tt@ptit.edu.vn', '191110002', 14),
('D24CQMR003', N'Le Bao Lam', '2006-03-03', N'Nam', 'lam.lb@ptit.edu.vn', '191110003', 14),
('D24CQMR004', N'Pham Lan Huong', '2006-04-04', N'Nu', 'huong.pl@ptit.edu.vn', '191110004', 15),
('D24CQMR005', N'Hoang Viet Hung', '2006-05-05', N'Nam', 'hung.hv@ptit.edu.vn', '191110005', 15),
('D24CQMR006', N'Vu Ngoc Lan', '2006-06-06', N'Nu', 'lan.vn@ptit.edu.vn', '191110006', 15),

-- Ke toan
('D24CQKT001', N'Nguyen Van Tien', '2006-01-01', N'Nam', 'tien.nv@ptit.edu.vn', '191111001', 16), 
('D24CQKT002', N'Tran Thuy Linh', '2006-02-02', N'Nu', 'linh.tt@ptit.edu.vn', '191111002', 16), 
('D24CQKT003', N'Le Minh Triet', '2006-03-03', N'Nam', 'triet.lm@ptit.edu.vn', '191111003', 16), 
('D24CQKT004', N'Pham Nhu Y', '2006-04-04', N'Nu', 'y.pn@ptit.edu.vn', '191111004', 17), 
('D24CQKT005', N'Hoang Van Quyet', '2006-05-05', N'Nam', 'quyet.hv@ptit.edu.vn', '191111005', 17), 
('D24CQKT006', N'Vu Thanh Tam', '2006-06-06', N'Nu', 'tam.vt@ptit.edu.vn', '191111006', 17),

-- Bao chi
('D24CQBC001', N'Nguyen Sy Hung', '2006-01-01', N'Nam', 'hung.ns@ptit.edu.vn', '290000001', 18), 
('D24CQBC002', N'Tran Minh Tam', '2006-02-02', N'Nu', 'tam.tm@ptit.edu.vn', '290000002', 18), 
('D24CQBC003', N'Le Hong Dang', '2006-03-03', N'Nam', 'dang.lh@ptit.edu.vn', '290000003', 18), 
('D24CQBC004', N'Pham My Hanh', '2006-04-04', N'Nu', 'hanhmy.pm@ptit.edu.vn', '290000004', 19), 
('D24CQBC005', N'Hoang Minh Nhat', '2006-05-05', N'Nam', 'nhat.hm@ptit.edu.vn', '290000005', 19), 
('D24CQBC006', N'Vu Dieu Huyen', '2006-06-06', N'Nu', 'huyen.vd@ptit.edu.vn', '290000006', 19),

-- Ngon ngu Anh
('D24CQNN001', N'Nguyen Trong Hieu', '2006-01-01', N'Nam', 'hieu.nt@ptit.edu.vn', '291000001', 20), 
('D24CQNN002', N'Tran Thu Ha', '2006-02-02', N'Nu', 'ha.tt@ptit.edu.vn', '291000002', 20), 
('D24CQNN003', N'Le Tan Tai', '2006-03-03', N'Nam', 'tai.lt@ptit.edu.vn', '291000003', 20), 
('D24CQNN004', N'Pham Thanh Thu', '2006-04-04', N'Nu', 'thu.pt@ptit.edu.vn', '291000004', 21), 
('D24CQNN005', N'Hoang Gia Huy', '2006-05-05', N'Nam', 'huy.hg@ptit.edu.vn', '291000005', 21), 
('D24CQNN006', N'Vu Phuong Vy', '2006-06-06', N'Nu', 'vy.vp@ptit.edu.vn', '291000006', 21);

INSERT INTO Semester (semester_name, year)
VALUES 
(N'HK1', 2026),
(N'HK2', 2026);

INSERT INTO Course_section (section_name, course_id, teacher_id, semester_id) VALUES
(N'CSVT01', 1, 1, 1),  -- Co so vien thong
(N'MAN01', 3, 5, 1),   -- Mang vien thong
(N'HTDD01', 5, 1, 1),  -- He thong thong tin di dong

(N'MD01', 6, 2, 1),    -- Mach dien tu co ban
(N'VXL01', 8, 7, 1),   -- Vi xu ly
(N'TKM01', 10, 2, 1),  -- Thiet ke mach

(N'LTC01', 11, 3, 1),  -- Lap trinh C
(N'CSDL01', 13, 9, 1), -- Co so du lieu
(N'DSA01', 14, 4, 1),  -- Cau truc du lieu va giai thuat
(N'LTW01', 15, 3, 1),  -- Lap trinh web

(N'MHTT01', 17, 6, 1), -- Ma hoa thong tin
(N'BMN01', 18, 10, 1), -- Bao mat mang
(N'KTBM01', 20, 6, 1), -- Kiem thu bao mat

(N'QTH01', 21, 8, 1),  -- Quan tri hoc
(N'KTVM01', 22, 12, 1);-- Kinh te vi mo

INSERT INTO Major_course (major_id, course_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(3, 11),
(3, 12),
(3, 13),
(3, 14),
(3, 15),
(3, 16),
(4, 17),
(4, 18),
(4, 19),
(4, 20),
(5, 21),
(5, 22),
(5, 23),
(5, 24);

INSERT INTO Enrollments (student_id, section_id) VALUES
(1, 1), (1, 7),
(2, 1),
(3, 1), (3, 7),
(4, 1),
(5, 1),
(6, 4), (6, 7),
(7, 4),
(8, 4), (8, 7),
(9, 4),
(10, 4), (10, 7),
(11, 4), (11, 5), (11, 6),
(12, 4), (12, 5), (12, 6),
(13, 4), (13, 5), (13, 6),
(14, 4), (14, 5), (14, 6),
(15, 4), (15, 5), (15, 6),
(16, 4), (16, 5), (16, 6),
(17, 4), (17, 5), (17, 6),
(18, 4), (18, 5), (18, 6),
(19, 4), (19, 5), (19, 6),
(20, 7), (20, 8), (20, 9),
(21, 7), (21, 8), (21, 10),
(22, 7), (22, 9), (22, 10),
(23, 8), (23, 9), (23, 10),
(24, 7), (24, 8),
(25, 9), (25, 10), (25, 7),
(26, 8), (26, 10),
(27, 7), (27, 8), (27, 9),
(28, 9), (28, 10),
(29, 7), (29, 8), (29, 10),
(30, 8), (30, 9),
(31, 7), (31, 9), (31, 10),
(32, 7), (32, 8), (32, 9),
(33, 8), (33, 10),
(34, 7), (34, 9), (34, 10);

INSERT INTO Student_score (score, type_score, enrollment_id) VALUES
(8.5, 'midterm', 1), (9.0, 'final', 1),
(7.0, 'midterm', 2), (7.5, 'final', 2),
(6.5, 'midterm', 3), (8.0, 'final', 3),
(9.5, 'midterm', 4), (10.0, 'final', 4),
(8.0, 'midterm', 5), (8.5, 'final', 5),
(2.0, 'midterm', 6), (2.0, 'final', 6),
(7.5, 'midterm', 7), (7.0, 'final', 7),
(8.0, 'midterm', 8), (8.5, 'final', 8),
(6.0, 'midterm', 9), (7.0, 'final', 9),
(4.5, 'midterm', 10), (5.5, 'final', 10),
(9.0, 'midterm', 11), (9.5, 'final', 11),
(8.5, 'midterm', 12), (8.0, 'final', 12),
(7.0, 'midterm', 13), (7.5, 'final', 13),
(6.5, 'midterm', 14), (6.0, 'final', 14),
(7.0, 'midterm', 15), (7.5, 'final', 15),

(8.0, 'midterm', 16), (8.5, 'final', 16),
(7.5, 'midterm', 17), (8.0, 'final', 17),
(9.0, 'midterm', 18), (8.5, 'final', 18),
(6.0, 'midterm', 19), (7.0, 'final', 19),
(1.5, 'midterm', 20), (2.5, 'final', 20),
(7.0, 'midterm', 21), (7.5, 'final', 21),
(9.5, 'midterm', 22), (9.0, 'final', 22),
(8.5, 'midterm', 23), (9.5, 'final', 23),
(10.0, 'midterm', 24), (9.5, 'final', 24),
(4.5, 'midterm', 25), (5.0, 'final', 25),
(5.5, 'midterm', 26), (6.0, 'final', 26),
(4.0, 'midterm', 27), (5.5, 'final', 27),
(1.0, 'midterm', 28), (2.5, 'final', 28),
(2.0, 'midterm', 29), (1.0, 'final', 29),
(7.5, 'midterm', 30), (8.0, 'final', 30),
(8.5, 'midterm', 31), (9.0, 'final', 31),
(9.0, 'midterm', 32), (8.5, 'final', 32),
(8.0, 'midterm', 33), (8.5, 'final', 33),
(6.5, 'midterm', 34), (7.0, 'final', 34),
(7.0, 'midterm', 35), (6.5, 'final', 35),
(6.0, 'midterm', 36), (7.0, 'final', 36),
(5.5, 'midterm', 37), (6.0, 'final', 37),
(6.5, 'midterm', 38), (5.5, 'final', 38),
(7.0, 'midterm', 39), (6.5, 'final', 39),
(9.0, 'midterm', 40), (9.5, 'final', 40),
(8.5, 'midterm', 41), (9.0, 'final', 41),
(3.5, 'midterm', 42), (0.5, 'final', 42),

(7.5, 'midterm', 43), (8.0, 'final', 43),
(6.0, 'midterm', 44), (7.0, 'final', 44),
(1.5, 'midterm', 45), (1.0, 'final', 45),
(9.0, 'midterm', 46), (8.5, 'final', 46),
(7.0, 'midterm', 47), (7.5, 'final', 47),
(8.0, 'midterm', 48), (8.0, 'final', 48),
(5.5, 'midterm', 49), (6.5, 'final', 49),
(1.0, 'midterm', 50), (1.0, 'final', 50),
(7.5, 'midterm', 51), (7.0, 'final', 51),
(8.0, 'midterm', 52), (8.5, 'final', 52),
(9.5, 'midterm', 53), (9.0, 'final', 53),
(7.0, 'midterm', 54), (7.5, 'final', 54),
(4.5, 'midterm', 55), (5.0, 'final', 55),
(6.0, 'midterm', 56), (5.5, 'final', 56),
(8.5, 'midterm', 57), (9.0, 'final', 57),
(7.5, 'midterm', 58), (8.0, 'final', 58),
(8.0, 'midterm', 59), (8.5, 'final', 59),
(7.0, 'midterm', 60), (7.0, 'final', 60),
(6.5, 'midterm', 61), (7.5, 'final', 61),
(9.0, 'midterm', 62), (10.0, 'final', 62),
(8.5, 'midterm', 63), (9.0, 'final', 63),
(9.5, 'midterm', 64), (9.5, 'final', 64),
(5.0, 'midterm', 65), (6.0, 'final', 65),
(5.5, 'midterm', 66), (5.0, 'final', 66),
(7.5, 'midterm', 67), (7.0, 'final', 67),
(8.0, 'midterm', 68), (8.5, 'final', 68),
(6.0, 'midterm', 69), (6.5, 'final', 69),
(8.5, 'midterm', 70), (9.0, 'final', 70),
(7.0, 'midterm', 71), (7.5, 'final', 71),
(9.5, 'midterm', 72), (9.5, 'final', 72),
(8.0, 'midterm', 73), (8.5, 'final', 73),
(9.0, 'midterm', 74), (9.0, 'final', 74),
(6.5, 'midterm', 75), (7.0, 'final', 75),
(7.0, 'midterm', 76), (6.5, 'final', 76),
(6.0, 'midterm', 77), (7.5, 'final', 77),
(8.0, 'midterm', 78), (8.0, 'final', 78),
(7.5, 'midterm', 79), (8.5, 'final', 79),
(5.5, 'midterm', 80), (6.0, 'final', 80),
(7.0, 'midterm', 81), (7.0, 'final', 81),
(6.5, 'midterm', 82), (6.5, 'final', 82);

