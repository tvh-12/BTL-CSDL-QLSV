USE QLSV;
GO

-- =============================================
-- YÊU CẦU 4: STORED PROCEDURE CHO THÊM/SỬA/XÓA
-- =============================================

-- 1. SP Thêm Sinh Viên
CREATE OR ALTER PROCEDURE sp_AddStudent
    @full_name NVARCHAR(255),
    @MASV NVARCHAR(50),
    @date_of_birth DATETIME2,
    @gender NVARCHAR(10),
    @email NVARCHAR(100),
    @phone NVARCHAR(20),
    @class_id INT
AS
BEGIN
    INSERT INTO Students (full_name, MASV, date_of_birth, gender, email, phone, class_id)
    VALUES (@full_name, @MASV, @date_of_birth, @gender, @email, @phone, @class_id);
END
GO

-- 2. SP Cập Nhật Sinh Viên
CREATE OR ALTER PROCEDURE sp_UpdateStudent
    @id INT,
    @full_name NVARCHAR(255),
    @MASV NVARCHAR(50),
    @date_of_birth DATETIME2,
    @gender NVARCHAR(10),
    @email NVARCHAR(100),
    @phone NVARCHAR(20),
    @class_id INT
AS
BEGIN
    UPDATE Students
    SET full_name = @full_name,
        MASV = @MASV,
        date_of_birth = @date_of_birth,
        gender = @gender,
        email = @email,
        phone = @phone,
        class_id = @class_id
    WHERE id = @id;
END
GO

-- 3. SP Xóa Sinh Viên
CREATE OR ALTER PROCEDURE sp_DeleteStudent
    @id INT
AS
BEGIN
    -- Xóa dữ liệu ở bảng Enrollments trước (tránh lỗi khóa ngoại)
    DELETE FROM Enrollments WHERE student_id = @id;
    DELETE FROM Students WHERE id = @id;
END
GO

-- =============================================
-- YÊU CẦU 4: TẠO VIEW TRUY VẤN DỮ LIỆU PHỨC TẠP
-- =============================================
CREATE OR ALTER VIEW v_StudentDetails AS
SELECT s.id, s.full_name, s.MASV, s.gender, s.date_of_birth, c.class_name, d.name AS department_name
FROM Students s
JOIN Classes c ON s.class_id = c.id
JOIN Department d ON c.department_id = d.id;
GO

-- =============================================
-- YÊU CẦU 4: TẠO INDEX ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =============================================
CREATE INDEX IDX_Student_Name ON Students(full_name);
CREATE INDEX IDX_Student_MASV ON Students(MASV);
GO
