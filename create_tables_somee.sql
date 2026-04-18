-- Chạy file này ĐẦU TIÊN để tạo các bảng và dữ liệu mẫu trên Somee
-- Không cần CREATE DATABASE hay USE vì đã kết nối thẳng vào QLSV_CSDL rồi

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

CREATE TABLE Department (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL
);

CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    department_id INT NOT NULL FOREIGN KEY REFERENCES Department(id)
);

CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    course_name NVARCHAR(255) NOT NULL
);

CREATE TABLE Semester (
    id INT PRIMARY KEY IDENTITY(1,1),
    semester_name NVARCHAR(20),
    year INT
);

CREATE TABLE Classes (
    id INT PRIMARY KEY IDENTITY(1,1),
    class_name NVARCHAR(50) NOT NULL,
    department_id INT FOREIGN KEY REFERENCES Department(id)
);

CREATE TABLE Major (
    id INT PRIMARY KEY IDENTITY(1,1),
    major_name NVARCHAR(100) NOT NULL,
    department_id INT FOREIGN KEY REFERENCES Department(id)
);

CREATE TABLE Major_course (
    major_id INT FOREIGN KEY REFERENCES Major(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    PRIMARY KEY (major_id, course_id)
);

CREATE TABLE Course_section (
    id INT PRIMARY KEY IDENTITY(1,1),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    semester_id INT FOREIGN KEY REFERENCES Semester(id),
    room NVARCHAR(50)
);

CREATE TABLE Students (
    id INT PRIMARY KEY IDENTITY(1,1),
    full_name NVARCHAR(255) NOT NULL,
    MASV NVARCHAR(50) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender NVARCHAR(10),
    email NVARCHAR(100) UNIQUE,
    phone NVARCHAR(20),
    class_id INT FOREIGN KEY REFERENCES Classes(id)
);

CREATE TABLE Enrollments (
    student_id INT FOREIGN KEY REFERENCES Students(id),
    section_id INT FOREIGN KEY REFERENCES Course_section(id),
    grade DECIMAL(4,2),
    PRIMARY KEY (student_id, section_id)
);

CREATE TABLE Student_score (
    student_id INT FOREIGN KEY REFERENCES Students(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    score DECIMAL(4,2),
    PRIMARY KEY (student_id, course_id)
);
GO

-- Thêm một vài dữ liệu mẫu để Web không bị trống
INSERT INTO Department (name) VALUES (N'Viễn thông'), (N'Công nghệ thông tin'), (N'Kế toán');
INSERT INTO Classes (class_name, department_id) VALUES (N'D20VT1', 1), (N'D20CQCN01', 2), (N'D20KT1', 3);
INSERT INTO Students (full_name, MASV, date_of_birth, gender, email, phone, class_id) VALUES
(N'Nguyễn Văn A', 'B20DCPT001', '2002-01-01', N'Nam', 'a@gmail.com', '0123456789', 1),
(N'Trần Thị B', 'B20DCPT002', '2002-02-02', N'Nu', 'b@gmail.com', '0123456788', 2);
GO
