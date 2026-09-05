-- ═══════════════════════════════════════════════════════════════════════
--                    پروژه: سامانه جامع فرتاک (Fartak)
--                    نوع دیتابیس: PostgreSQL
--                    تاریخ: 2026-04-20
-- ═══════════════════════════════════════════════════════════════════════

-- ایجاد دیتابیس (در psql اجرا شود)
-- CREATE DATABASE roshana_db
--     ENCODING 'UTF8'
--     LC_COLLATE = 'fa_IR.UTF-8'
--     LC_CTYPE = 'fa_IR.UTF-8'
--     TEMPLATE template0;

-- اتصال به دیتابیس
-- \c roshana_db;

-- فعال‌سازی افزونه uuid در صورت نیاز (اختیاری)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════
--                     تابع کمکی برای به‌روزرسانی خودکار updatedAt
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱. جدول کاربران اصلی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    "subRole" VARCHAR(50),
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "fatherName" VARCHAR(50),
    "nationalCode" VARCHAR(20) UNIQUE,
    "idNumber" VARCHAR(20),
    "birthDate" DATE,
    "birthPlace" VARCHAR(100),
    gender VARCHAR(10) NOT NULL,
    "bloodType" VARCHAR(5),
    religion VARCHAR(50),
    denomination VARCHAR(50),
    "educationLevel" VARCHAR(50),
    "fieldOfStudy" VARCHAR(100),
    university VARCHAR(100),
    phone2 VARCHAR(20),
    phone3 VARCHAR(20),
    "homePhone" VARCHAR(20),
    "fatherPhone" VARCHAR(20),
    "motherPhone" VARCHAR(20),
    "emergencyPhone" VARCHAR(20),
    "telegramId" VARCHAR(50),
    "instagramId" VARCHAR(50),
    "baleId" VARCHAR(50),
    "eitaaId" VARCHAR(50),
    whatsapp VARCHAR(50),
    linkedin VARCHAR(100),
    twitter VARCHAR(50),
    address TEXT,
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    "postalCode" VARCHAR(10),
    "profilePhoto" VARCHAR(500),
    "idBooklet" VARCHAR(500),
    "nationalCard" VARCHAR(500),
    "educationDoc" VARCHAR(500),
    "birthCertificate" VARCHAR(500),
    "isActive" BOOLEAN DEFAULT TRUE,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verificationDate" TIMESTAMP,
    "lastLogin" TIMESTAMP,
    "lastLoginIP" VARCHAR(45),
    "loginCount" INTEGER DEFAULT 0,
    "twoFactorEnabled" BOOLEAN DEFAULT FALSE,
    "twoFactorSecret" VARCHAR(255),
    "passwordChangedAt" TIMESTAMP,
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ایندکس‌های جدول users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nationalCode ON users("nationalCode");
CREATE INDEX idx_users_isActive ON users("isActive");

-- تریگر برای به‌روزرسانی خودکار updatedAt
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲. جدول ترم‌های تحصیلی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE academic_terms (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    term INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "registrationStart" DATE,
    "registrationEnd" DATE,
    "examStartDate" DATE,
    "examEndDate" DATE,
    "isCurrent" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_academic_terms_year_term UNIQUE (year, term)
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۳. جدول دانشکده‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    "deanId" BIGINT,
    "establishmentDate" VARCHAR(20),
    description TEXT,
    logo VARCHAR(500),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_faculties_dean FOREIGN KEY ("deanId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_faculties_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۴. جدول گروه‌های آموزشی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    "facultyId" INTEGER,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    "headId" BIGINT,
    "establishmentDate" VARCHAR(20),
    description TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_departments_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_departments_head FOREIGN KEY ("headId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۵. جدول دانشجویان
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "studentNumber" VARCHAR(20) UNIQUE NOT NULL,
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "fieldOfStudy" VARCHAR(100),
    "studyLevel" VARCHAR(50),
    "studyType" VARCHAR(50),
    "enrollmentYear" INTEGER,
    "enrollmentTerm" INTEGER,
    "currentTerm" INTEGER DEFAULT 1,
    gpa DECIMAL(4,2),
    "totalCredits" INTEGER DEFAULT 0,
    "earnedCredits" INTEGER DEFAULT 0,
    "academicAdvisorId" BIGINT,
    "culturalAdvisorId" BIGINT,
    "studyStatus" VARCHAR(20) DEFAULT 'active',
    "graduationStatus" VARCHAR(50),
    "graduationDate" DATE,
    "thesisTitle" VARCHAR(200),
    "thesisGrade" DECIMAL(5,2),
    "courseType" VARCHAR(50),
    "hasDormitory" BOOLEAN DEFAULT FALSE,
    "dormitoryInfo" TEXT,
    "housingStatus" VARCHAR(50),
    "insuranceNumber" VARCHAR(30),
    "insuranceExpiry" DATE,
    "bankAccount" VARCHAR(30),
    "shabaNumber" VARCHAR(30),
    badges JSONB,
    honors JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_students_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_students_academic_advisor FOREIGN KEY ("academicAdvisorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_students_cultural_advisor FOREIGN KEY ("culturalAdvisorId") REFERENCES users(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_students_studentNumber ON students("studentNumber");
-- CREATE INDEX idx_students_userId ON students("userId");
-- CREATE INDEX idx_students_facultyId ON students("facultyId");
-- CREATE INDEX idx_students_departmentId ON students("departmentId");
-- CREATE INDEX idx_students_studyStatus ON students("studyStatus");

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۶. جدول استادان
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE professors (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "employeeNumber" VARCHAR(20) UNIQUE NOT NULL,
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "academicRank" VARCHAR(50),
    "fieldOfStudy" VARCHAR(100),
    specialization VARCHAR(100),
    "hireDate" VARCHAR(20),
    "employmentType" VARCHAR(50),
    "contractType" VARCHAR(50),
    "officeLocation" VARCHAR(100),
    "officePhone" VARCHAR(20),
    "officeEmail" VARCHAR(100),
    "personalWebsite" VARCHAR(200),
    "researchInterests" TEXT,
    publications TEXT,
    "orcidId" VARCHAR(50),
    "researcherId" VARCHAR(50),
    "isAdvisor" BOOLEAN DEFAULT FALSE,
    "isCulturalAdvisor" BOOLEAN DEFAULT FALSE,
    "isThesisSupervisor" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_professors_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_professors_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_professors_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_professors_employeeNumber ON professors("employeeNumber");
-- CREATE INDEX idx_professors_userId ON professors("userId");
-- CREATE INDEX idx_professors_facultyId ON professors("facultyId");

CREATE TRIGGER trg_professors_updated_at
    BEFORE UPDATE ON professors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۷. جدول کارکنان
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "employeeNumber" VARCHAR(20) UNIQUE NOT NULL,
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "position" VARCHAR(50),
    "jobTitle" VARCHAR(100),
    "employmentType" VARCHAR(50),
    "hireDate" VARCHAR(20),
    "managerId" INTEGER,
    "canManageStudents" BOOLEAN DEFAULT FALSE,
    "canManageGrades" BOOLEAN DEFAULT FALSE,
    "canManageCourses" BOOLEAN DEFAULT FALSE,
    "canViewReports" BOOLEAN DEFAULT FALSE,
    "canManageStaff" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_manager FOREIGN KEY ("managerId") REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۸. جدول معاونت فرهنگی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE cultural_deputy (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "employeeNumber" VARCHAR(20) UNIQUE,
    section VARCHAR(50),
    "position" VARCHAR(50),
    responsibilities TEXT,
    "supervisedOrganizations" TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cultural_deputy_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_cultural_deputy_updated_at
    BEFORE UPDATE ON cultural_deputy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۹. جدول تشکل‌ها و کانون‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    logo VARCHAR(500),
    description TEXT,
    "establishmentDate" VARCHAR(20),
    charter TEXT,
    "supervisorId" BIGINT,
    "advisorId" BIGINT,
    "memberCount" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizations_supervisor FOREIGN KEY ("supervisorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_organizations_advisor FOREIGN KEY ("advisorId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_organizations_type ON organizations(type);

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۰. جدول اعضای تشکل‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE organization_members (
    id SERIAL PRIMARY KEY,
    "organizationId" INTEGER,
    "userId" BIGINT,
    role VARCHAR(50),
    "position" VARCHAR(50),
    responsibilities TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_members_org FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_org_members_org_user UNIQUE ("organizationId", "userId")
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۱. جدول بسیج
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE basij (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "membershipDate" VARCHAR(20),
    "membershipType" VARCHAR(50),
    unit VARCHAR(100),
    subunit VARCHAR(100),
    responsibility VARCHAR(100),
    "position" VARCHAR(50),
    "participationCount" INTEGER DEFAULT 0,
    "lastParticipation" DATE,
    skills TEXT,
    trainings TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_basij_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_basij_updated_at
    BEFORE UPDATE ON basij
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۲. جدول دروس
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    "theoryHours" INTEGER DEFAULT 0,
    "practiceHours" INTEGER DEFAULT 0,
    "labHours" INTEGER DEFAULT 0,
    "theoryCredits" INTEGER DEFAULT 0,
    "practiceCredits" INTEGER DEFAULT 0,
    "departmentId" INTEGER,
    "professorId" BIGINT,
    type VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    prerequisites TEXT,
    corequisites TEXT,
    capacity INTEGER,
    "enrolledCount" INTEGER DEFAULT 0,
    "waitlistCount" INTEGER DEFAULT 0,
    "termId" INTEGER,
    year INTEGER,
    semester INTEGER,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_courses_professor FOREIGN KEY ("professorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_courses_term FOREIGN KEY ("termId") REFERENCES academic_terms(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_courses_code ON courses(code);
-- CREATE INDEX idx_courses_departmentId ON courses("departmentId");
-- CREATE INDEX idx_courses_professorId ON courses("professorId");
-- CREATE INDEX idx_courses_termId ON courses("termId");

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۳. جدول ثبت‌نام دروس
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "courseId" INTEGER,
    "termId" INTEGER,
    status VARCHAR(20) DEFAULT 'enrolled',
    "enrollmentType" VARCHAR(20) DEFAULT 'regular',
    "enrollmentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "dropDate" TIMESTAMP,
    "dropReason" TEXT,
    "finalGrade" DECIMAL(5,2),
    "gradeLetter" VARCHAR(5),
    "gradePoint" DECIMAL(4,2),
    passed BOOLEAN DEFAULT FALSE,
    "attendancePercentage" DECIMAL(5,2),
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completionDate" TIMESTAMP,
    CONSTRAINT fk_enrollments_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_term FOREIGN KEY ("termId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT uk_enrollments_student_course_term UNIQUE ("studentId", "courseId", "termId")
);

-- CREATE INDEX idx_enrollments_studentId ON enrollments("studentId");
-- CREATE INDEX idx_enrollments_courseId ON enrollments("courseId");
-- CREATE INDEX idx_enrollments_termId ON enrollments("termId");
-- CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۴. جدول نمرات
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    "enrollmentId" INTEGER,
    "componentName" VARCHAR(100) NOT NULL,
    "componentType" VARCHAR(50),
    "componentWeight" DECIMAL(5,2),
    score DECIMAL(5,2),
    "maxScore" DECIMAL(5,2) DEFAULT 100,
    grade VARCHAR(5),
    "gradePoint" DECIMAL(4,2),
    "gradeType" VARCHAR(20) DEFAULT 'theory',
    "isFinal" BOOLEAN DEFAULT FALSE,
    "recordedBy" BIGINT,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    CONSTRAINT fk_grades_enrollment FOREIGN KEY ("enrollmentId") REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_grades_recorded_by FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_grades_updated_by FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_grades_enrollmentId ON grades("enrollmentId");
-- CREATE INDEX idx_grades_recordedBy ON grades("recordedBy");

CREATE TRIGGER trg_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۵. جدول برنامه کلاسی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER,
    "professorId" BIGINT,
    "dayOfWeek" VARCHAR(20) NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    location VARCHAR(100),
    building VARCHAR(50),
    room VARCHAR(20),
    floor INTEGER,
    "termId" INTEGER,
    "weekType" VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedules_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_professor FOREIGN KEY ("professorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedules_term FOREIGN KEY ("termId") REFERENCES academic_terms(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۶. جدول حضور و غیاب
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "courseId" INTEGER,
    "sessionId" INTEGER,
    "sessionDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    status VARCHAR(20) DEFAULT 'present',
    "presenceTime" INTEGER,
    "absenceType" VARCHAR(50),
    remarks TEXT,
    "recordedBy" BIGINT,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_recorded_by FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_attendance_student_course_session UNIQUE ("studentId", "courseId", "sessionId", "sessionDate")
);

-- CREATE INDEX idx_attendance_studentId ON attendance("studentId");
-- CREATE INDEX idx_attendance_courseId ON attendance("courseId");
-- CREATE INDEX idx_attendance_sessionDate ON attendance("sessionDate");

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۷. جدول جلسات کلاس
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE class_sessions (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER,
    "sessionNumber" INTEGER NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    topic VARCHAR(200),
    description TEXT,
    "recordingUrl" VARCHAR(500),
    "attendanceRequired" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_sessions_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۸. جدول کارگاه‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE workshops (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    objectives TEXT,
    syllabus TEXT,
    "instructorId" BIGINT,
    "organizerId" BIGINT,
    "organizationId" INTEGER,
    level VARCHAR(20),
    duration INTEGER,
    "durationUnit" VARCHAR(20),
    capacity INTEGER,
    "enrolledCount" INTEGER DEFAULT 0,
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "registrationStart" DATE,
    "registrationEnd" DATE,
    location VARCHAR(200),
    "onlineLink" VARCHAR(500),
    "isOnline" BOOLEAN DEFAULT FALSE,
    "certificateType" VARCHAR(50),
    "certificateTemplate" VARCHAR(500),
    cost DECIMAL(12,2) DEFAULT 0,
    "isFree" BOOLEAN DEFAULT TRUE,
    poster VARCHAR(500),
    attachments TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workshops_instructor FOREIGN KEY ("instructorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_workshops_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_workshops_organization FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_workshops_updated_at
    BEFORE UPDATE ON workshops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۱۹. جدول ثبت‌نام کارگاه‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE workshop_registrations (
    id SERIAL PRIMARY KEY,
    "workshopId" INTEGER,
    "userId" BIGINT,
    "registrationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    "attendanceCount" INTEGER DEFAULT 0,
    "absenceCount" INTEGER DEFAULT 0,
    "skillLevel" VARCHAR(20),
    "finalScore" DECIMAL(5,2),
    "finalResult" VARCHAR(20),
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    "certificateDate" TIMESTAMP,
    feedback TEXT,
    rating INTEGER,
    CONSTRAINT fk_workshop_reg_workshop FOREIGN KEY ("workshopId") REFERENCES workshops(id) ON DELETE CASCADE,
    CONSTRAINT fk_workshop_reg_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_workshop_reg_workshop_user UNIQUE ("workshopId", "userId")
);

-- CREATE INDEX idx_workshop_reg_workshopId ON workshop_registrations("workshopId");
-- CREATE INDEX idx_workshop_reg_userId ON workshop_registrations("userId");

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۰. جدول فعالیت‌های دانشجو
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE student_activities (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "activityType" VARCHAR(50) NOT NULL,
    "activityId" INTEGER,
    "activityTable" VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "sessionsAttended" INTEGER DEFAULT 0,
    "sessionsTotal" INTEGER DEFAULT 0,
    "attendancePercentage" DECIMAL(5,2),
    "skillLevel" VARCHAR(20),
    "skillsAcquired" TEXT,
    "finalScore" DECIMAL(5,2),
    "finalResult" VARCHAR(20),
    grade VARCHAR(5),
    report TEXT,
    attachments TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_activities_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_student_activities_updated_at
    BEFORE UPDATE ON student_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۱. جدول کارنامه تحصیلی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE transcripts (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "termId" INTEGER,
    "termGPA" DECIMAL(4,2),
    "termCredits" INTEGER,
    "termPassedCredits" INTEGER,
    "overallGPA" DECIMAL(4,2),
    "overallCredits" INTEGER,
    "overallPassedCredits" INTEGER,
    "termRank" INTEGER,
    "termTotalStudents" INTEGER,
    "overallRank" INTEGER,
    "overallTotalStudents" INTEGER,
    "coursesData" JSONB,
    status VARCHAR(20) DEFAULT 'issued',
    "issuedBy" BIGINT,
    "issuedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transcripts_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transcripts_term FOREIGN KEY ("termId") REFERENCES academic_terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_transcripts_issued_by FOREIGN KEY ("issuedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_transcripts_student_term UNIQUE ("studentId", "termId")
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۲. جدول گزارش‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    query TEXT,
    filters JSONB,
    columns JSONB,
    "generatedBy" BIGINT,
    "generatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" VARCHAR(500),
    "fileType" VARCHAR(20),
    "fileSize" INTEGER,
    "isTemplate" BOOLEAN DEFAULT FALSE,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "accessRoles" JSONB,
    "accessUsers" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_generated_by FOREIGN KEY ("generatedBy") REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۳. جدول اتوماسیون و نامه‌نگاری
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE correspondence (
    id SERIAL PRIMARY KEY,
    "letterNumber" VARCHAR(50) UNIQUE,
    "letterNumberPrefix" VARCHAR(20),
    "letterNumberSequence" INTEGER,
    subject VARCHAR(300) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    confidentiality VARCHAR(20) DEFAULT 'normal',
    "senderId" BIGINT,
    "senderDepartment" INTEGER,
    "senderRole" VARCHAR(50),
    "recipientId" BIGINT,
    "recipientDepartment" INTEGER,
    "recipientRole" VARCHAR(50),
    "recipientExternal" VARCHAR(200),
    status VARCHAR(20) DEFAULT 'draft',
    "currentStep" INTEGER DEFAULT 1,
    "dueDate" DATE,
    "responseRequired" BOOLEAN DEFAULT FALSE,
    "responseToId" INTEGER,
    "responseDeadline" DATE,
    attachments TEXT,
    "attachmentFiles" TEXT,
    "signedBy" BIGINT,
    "signedAt" TIMESTAMP,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    CONSTRAINT fk_correspondence_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_correspondence_sender_dept FOREIGN KEY ("senderDepartment") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_correspondence_recipient FOREIGN KEY ("recipientId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_correspondence_recipient_dept FOREIGN KEY ("recipientDepartment") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_correspondence_response_to FOREIGN KEY ("responseToId") REFERENCES correspondence(id) ON DELETE SET NULL,
    CONSTRAINT fk_correspondence_signed_by FOREIGN KEY ("signedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_correspondence_senderId ON correspondence("senderId");
-- CREATE INDEX idx_correspondence_recipientId ON correspondence("recipientId");
-- CREATE INDEX idx_correspondence_status ON correspondence(status);
-- CREATE INDEX idx_correspondence_letterNumber ON correspondence("letterNumber");

CREATE TRIGGER trg_correspondence_updated_at
    BEFORE UPDATE ON correspondence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۴. جدول گردش کار نامه‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE correspondence_flow (
    id SERIAL PRIMARY KEY,
    "correspondenceId" INTEGER,
    "stepNumber" INTEGER NOT NULL,
    "fromUserId" BIGINT,
    "fromDepartment" INTEGER,
    "toUserId" BIGINT,
    "toDepartment" INTEGER,
    action TEXT NOT NULL,
    "actionText" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_corr_flow_correspondence FOREIGN KEY ("correspondenceId") REFERENCES correspondence(id) ON DELETE CASCADE,
    CONSTRAINT fk_corr_flow_from_user FOREIGN KEY ("fromUserId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_flow_from_dept FOREIGN KEY ("fromDepartment") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_flow_to_user FOREIGN KEY ("toUserId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_flow_to_dept FOREIGN KEY ("toDepartment") REFERENCES departments(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════════════
--                    ۲۵. جدول حراست و امنیت
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE security (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "reportedBy" BIGINT,
    "assignedTo" BIGINT,
    severity VARCHAR(20) DEFAULT 'low',
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    location VARCHAR(200),
    "locationDetail" TEXT,
    evidence TEXT,
    "evidenceFiles" TEXT,
    resolution TEXT,
    "resolvedBy" BIGINT,
    "resolvedAt" TIMESTAMP,
    "relatedUsers" JSONB,
    "relatedIncidents" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_reported_by FOREIGN KEY ("reportedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_security_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_security_resolved_by FOREIGN KEY ("resolvedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- CREATE INDEX idx_security_reportedBy ON security("reportedBy");
-- CREATE INDEX idx_security_assignedTo ON security("assignedTo");
-- CREATE INDEX idx_security_status ON security(status);
-- CREATE INDEX idx_security_type ON security(type);

CREATE TRIGGER trg_security_updated_at
    BEFORE UPDATE ON security
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                 جداول تکمیلی پیشنهادی (گسترش اسکیما)
-- ═══════════════════════════════════════════════════════════════════════

-- ۲۶. جدول اعلان‌ها و پیام‌های سیستمی
-- استفاده از نوع ENUM برای فیلد type (به جای VARCHAR)
CREATE TYPE notification_type AS ENUM ('system', 'info', 'warning', 'alert', 'promotion', 'reminder', 'message');

-- جدول اصلی با ترکیب تمام فیلدهای مفید از هر دو جدول
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,                      -- به جای "userId" با اسنیک‌کیس استاندارد
    type notification_type NOT NULL DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),                            -- لینک کامل (از جدول دوم)
    link_type VARCHAR(30),                        -- مثلاً 'order', 'product', 'profile'
    link_id BIGINT,                               -- شناسه مرتبط با link_type
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    is_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    is_sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    is_push_sent BOOLEAN NOT NULL DEFAULT FALSE,
    priority SMALLINT DEFAULT 0,                  -- 0=عادی، 1=بالا، 2=فوری
    expires_at TIMESTAMP WITHOUT TIME ZONE,      -- تاریخ انقضای نوتیفیکیشن
    metadata JSONB DEFAULT '{}',                  -- داده‌های اضافی و قابل توسعه (خفن!)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_read_at CHECK ( (is_read = false AND read_at IS NULL) OR (is_read = true AND read_at IS NOT NULL) ),
    CONSTRAINT chk_link CHECK ( (link IS NULL AND link_type IS NULL AND link_id IS NULL) OR 
                                (link IS NOT NULL OR (link_type IS NOT NULL AND link_id IS NOT NULL)) )
);

-- ========================
-- ایندکس‌های بهینه و ترکیبی (خفن‌ترین بخش)
-- ========================
-- پرکاربردترین کوئری‌ها: نوتیفیکیشن‌های خوانده‌نشده یک کاربر
-- CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- کوئری‌های زمانی (آخرین نوتیفیکیشن‌ها)
-- CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- فیلتر بر اساس نوع و اولویت
-- CREATE INDEX idx_notifications_type_priority ON notifications(type, priority);

-- برای جستجو در metadata (JSONB) - خیلی خفن!
-- CREATE INDEX idx_notifications_metadata ON notifications USING gin(metadata);

-- پاکسازی خودکار نوتیفیکیشن‌های منقضی شده (با کمک expires_at)
-- CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ========================
-- توابع و تریگرهای پیشرفته
-- ========================

-- به‌روزرسانی خودکار read_at هنگام تغییر is_read
CREATE OR REPLACE FUNCTION update_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    ELSIF NEW.is_read = false THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_read_at();

-- به‌روزرسانی خودکار updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================
-- پارتیشن‌بندی (اختیاری، برای جدول‌های خیلی بزرگ)
-- ========================
-- می‌توان بر اساس محدوده زمانی پارتیشن بندی کرد، اینجا فقط شِمای کلی نوشته شده
-- (برای حجم میلیون‌ها رکورد، جدول اصلی را به پارتیشن‌های ماهانه تقسیم کنید)

-- ========================
-- کامنت‌های توضیحی برای نگهداری راحت‌تر
-- ========================
COMMENT ON TABLE notifications IS 'سیستم اعلانات پیشرفته با پشتیبانی از لینک‌های هوشمند، متادیتا، اولویت‌بندی و انقضا';
COMMENT ON COLUMN notifications.metadata IS 'ذخیره اطلاعات اضافی مثل آیکون، رنگ، تصویر، داده‌های کلاینت و ... به صورت JSON';
COMMENT ON COLUMN notifications.priority IS '۰: عادی، ۱: بالا، ۲: فوری';

-- ۲۷. جدول لاگ‌های سیستم (Audit Log)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT,
    action VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50),
    "entityId" BIGINT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_audit_logs_userId ON audit_logs("userId");
-- CREATE INDEX idx_audit_logs_entity ON audit_logs("entityType", "entityId");
-- CREATE INDEX idx_audit_logs_createdAt ON audit_logs("createdAt");

-- ۲۸. جدول تنظیمات سیستم
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_system_settings_updated_by FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL
);
CREATE TRIGGER trg_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ۲۹. جدول تقویم آموزشی و مناسبت‌ها
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200) NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "allDay" BOOLEAN DEFAULT TRUE,
    description TEXT,
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" BIGINT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendar_events_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_calendar_events_dates ON calendar_events("startDate", "endDate");
CREATE TRIGGER trg_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ۳۰. جدول پیوست‌ها (برای مدیریت فایل‌های آپلود شده)
CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" BIGINT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" BIGINT,
    "mimeType" VARCHAR(100),
    "uploadedBy" BIGINT,
    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY ("uploadedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_attachments_entity ON attachments("entityType", "entityId");

-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۲۶ تا ۴۹)
-- ═══════════════════════════════════════════════════════════════════════

-- ۲۶. جدول تردد و ورود/خروج
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "entryType" VARCHAR(20) NOT NULL,
    "entryMethod" VARCHAR(20),
    location VARCHAR(100),
    gate VARCHAR(50),
    "cameraId" VARCHAR(50),
    "cardNumber" VARCHAR(50),
    "biometricData" TEXT,
    photo TEXT,
    "photoUrl" VARCHAR(500),
    temperature DECIMAL(4,1),
    status VARCHAR(20) DEFAULT 'allowed',
    "rejectionReason" VARCHAR(200),
    "vehiclePlate" VARCHAR(20),
    "vehicleInfo" TEXT,
    remarks TEXT,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_access_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_access_logs_userId ON access_logs("userId");
-- CREATE INDEX idx_access_logs_recordedAt ON access_logs("recordedAt");
-- CREATE INDEX idx_access_logs_entryType ON access_logs("entryType");

-- ۲۷. جدول صیانت
CREATE TABLE protection (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    severity VARCHAR(20) DEFAULT 'normal',
    "assignedTo" BIGINT,
    "assignedAt" TIMESTAMP,
    investigation TEXT,
    findings TEXT,
    resolution TEXT,
    "resolvedBy" BIGINT,
    "resolvedAt" TIMESTAMP,
    attachments TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_protection_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_protection_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_protection_resolved_by FOREIGN KEY ("resolvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_protection_userId ON protection("userId");
-- CREATE INDEX idx_protection_type ON protection(type);
-- CREATE INDEX idx_protection_status ON protection(status);
CREATE TRIGGER trg_protection_updated_at
    BEFORE UPDATE ON protection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۸. جدول امور رفاهی
CREATE TABLE welfare (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'IRR',
    "paymentMethod" VARCHAR(30),
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentDate" TIMESTAMP,
    "transactionId" VARCHAR(50),
    attachment VARCHAR(500),
    attachments TEXT,
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_welfare_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_welfare_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_welfare_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_welfare_userId ON welfare("userId");
-- CREATE INDEX idx_welfare_type ON welfare(type);
-- CREATE INDEX idx_welfare_status ON welfare(status);
CREATE TRIGGER trg_welfare_updated_at
    BEFORE UPDATE ON welfare FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                    ماژول LMS (سیستم مدیریت آموزش)
-- ═══════════════════════════════════════════════════════════════════════

-- =============================================
-- 0. توابع عمومی (قبل از هر جدول و تریگر)
-- =============================================

-- تابع به‌روزرسانی updated_at (برای تمام جداول)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تابع تنظیم خودکار published_at هنگام انتشار دوره
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تابع افزایش view_count دوره (اختیاری)
CREATE OR REPLACE FUNCTION increment_course_view(p_course_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE lms_courses SET view_count = view_count + 1 WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. ایجاد نوع‌های ENUM برای استفاده در جداول LMS
-- =============================================
CREATE TYPE user_role_enum AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE currency_enum AS ENUM ('IRR', 'USD', 'EUR');
CREATE TYPE course_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'all');
CREATE TYPE course_status_enum AS ENUM ('draft', 'published', 'archived');
CREATE TYPE video_type_enum AS ENUM ('youtube', 'vimeo', 'internal', 'aparat');
CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE discount_type_enum AS ENUM ('percent', 'fixed_amount');

-- =============================================
-- 2. جداول اصلی LMS
-- =============================================

-- جدول کاربران LMS (مستقل از جدول users اصلی سامانه فرتاک)
-- توجه: این جدول برای ماژول LMS مجزا طراحی شده است.
CREATE TABLE lms_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT,
    role user_role_enum DEFAULT 'student',
    national_code VARCHAR(20) UNIQUE,
    birth_date DATE,
    gender gender_enum,
    bio TEXT,
    telegram_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_lms_users_email ON lms_users(email);
-- CREATE INDEX idx_lms_users_phone ON lms_users(phone);
-- CREATE INDEX idx_lms_users_role ON lms_users(role);
CREATE TRIGGER trg_lms_users_updated_at
    BEFORE UPDATE ON lms_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول دسته‌بندی‌ها
CREATE TABLE lms_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER NULL,
    icon TEXT,
    image TEXT,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_categories_parent FOREIGN KEY (parent_id) REFERENCES lms_categories(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_lms_categories_slug ON lms_categories(slug);
-- CREATE INDEX idx_lms_categories_parent ON lms_categories(parent_id);
CREATE TRIGGER trg_lms_categories_updated_at
    BEFORE UPDATE ON lms_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول دوره‌ها
-- =============================================
-- 1. ایجاد انواع ENUM های مورد نیاز
-- =============================================

CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
CREATE TYPE course_status AS ENUM ('draft', 'pending_review', 'published', 'archived', 'deleted');
CREATE TYPE currency_type AS ENUM ('IRR', 'USD', 'EUR', 'GBP');
CREATE TYPE duration_unit_type AS ENUM ('minute', 'hour', 'day', 'week');

-- =============================================
-- 2. جدول اصلی lms_courses (ترکیب کامل دو جدول)
-- =============================================

CREATE TABLE lms_courses (
    -- ==================== شناسه اصلی ====================
    id BIGSERIAL PRIMARY KEY,
    
    -- ==================== ارجاع به جدول courses (از جدول اول) ====================
    course_id BIGINT,                                   -- فیلد missing قبلی
    -- ==================== فیلدهای شناسایی و مسیریابی ====================
    slug VARCHAR(200) UNIQUE NOT NULL,                  -- از جدول دوم (ضروری)
    title VARCHAR(200) NOT NULL,
    title_fa VARCHAR(200),                              -- از جدول اول
    
    -- ==================== توضیحات ====================
    description TEXT,
    short_description VARCHAR(300),                     -- از هر دو
    
    -- ==================== رسانه‌ها ====================
    thumbnail VARCHAR(500),                             -- از جدول اول
    image TEXT,                                         -- از جدول دوم
    video_preview TEXT,                                 -- از جدول دوم
    
    -- ==================== قیمت و ارز ====================
    currency currency_type NOT NULL DEFAULT 'IRR',      -- از جدول دوم
    price BIGINT NOT NULL DEFAULT 0,                    -- قیمت پایه (به کوچکترین واحد)
    discount_price BIGINT,                              -- قیمت تخفیف‌خورده
    is_free BOOLEAN GENERATED ALWAYS AS (price = 0 OR discount_price = 0) STORED, -- محاسباتی
    
    -- ==================== مدرس ====================
    instructor_id BIGINT NOT NULL,                      -- از جدول اول (instructorId) / جدول دوم (teacher_id)
    
    -- ==================== دسته‌بندی ====================
    category VARCHAR(50),                               -- از جدول اول (نگهداری شد برای سازگاری)
    category_id INTEGER,                                -- از جدول دوم (ارجاع به lms_categories)
    sub_category_id INTEGER,                            -- بهبود: سطوح بیشتر
    
    -- ==================== تگ‌ها ====================
    tags TEXT[],                                        -- آرایه تگ (جایگزین VARCHAR(200) از جدول اول)
    
    -- ==================== سطح و زمان ====================
    level course_level NOT NULL DEFAULT 'beginner',
    duration INTEGER DEFAULT 0,                         -- از جدول اول
    duration_unit duration_unit_type DEFAULT 'minute',  -- از جدول اول
    total_hours INTEGER DEFAULT 0,                      -- از جدول دوم (می‌تواند جمع کل ساعات باشد)
    episode_count INTEGER DEFAULT 0,                    -- از جدول دوم
    
    -- ==================== وضعیت انتشار ====================
    is_published BOOLEAN DEFAULT FALSE,                 -- از جدول اول (نگهداری شد)
    is_featured BOOLEAN DEFAULT FALSE,                  -- از جدول اول
    status course_status NOT NULL DEFAULT 'draft',      -- از جدول دوم (دقیق‌تر)
    published_at TIMESTAMP WITHOUT TIME ZONE,           -- از جدول دوم
    
    -- ==================== تاریخ‌های ثبت‌نام و اجرا ====================
    start_date DATE,                                    -- از جدول اول
    end_date DATE,                                      -- از جدول اول
    enrollment_start_date DATE,                         -- از جدول اول
    enrollment_end_date DATE,                           -- از جدول اول
    
    -- ==================== گواهی ====================
    certificate_enabled BOOLEAN DEFAULT FALSE,          -- از جدول اول
    certificate_template VARCHAR(500),                  -- از جدول اول
    
    -- ==================== پیش‌نیازها و دستاوردها ====================
    prerequisites TEXT,                                 -- از جدول اول (نگهداری TEXT ساده)
    prerequisites_json JSONB DEFAULT '[]',              -- نسخه پیشرفته JSONB (برای انعطاف)
    learning_outcomes TEXT,                             -- از جدول اول (نگهداری TEXT ساده)
    learning_outcomes_json JSONB DEFAULT '[]',          -- نسخه پیشرفته JSONB
    
    -- ==================== آمار و رتبه‌بندی ====================
    view_count INTEGER DEFAULT 0,                       -- از جدول اول
    enrollment_count INTEGER DEFAULT 0,                 -- از جدول اول = student_count از جدول دوم
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER DEFAULT 0,                     -- از جدول اول
    review_count INTEGER DEFAULT 0,                     -- بهبود: تعداد نظرات
    
    -- ==================== سئو (از جدول دوم) ====================
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    meta_keywords TEXT[],                               -- آرایه کلمات کلیدی
    
    -- ==================== داده‌های فراتن (توسعه‌پذیر) ====================
    extra_data JSONB DEFAULT '{}',
    
    -- ==================== سیستم زمانی ====================
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ==================== محدودیت‌ها (Foreign Keys & Checks) ====================
    CONSTRAINT fk_lms_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_lms_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lms_courses_category FOREIGN KEY (category_id) REFERENCES lms_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_lms_courses_sub_category FOREIGN KEY (sub_category_id) REFERENCES lms_categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_dates CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (enrollment_start_date IS NULL OR enrollment_end_date IS NULL OR enrollment_start_date <= enrollment_end_date)
    ),
    CONSTRAINT chk_price CHECK (price >= 0 AND (discount_price IS NULL OR discount_price <= price)),
    CONSTRAINT chk_duration CHECK (duration >= 0 AND total_hours >= 0 AND episode_count >= 0)
);

-- =============================================
-- 3. ایندکس‌های بهینه (پیشرفته و ترکیبی)
-- =============================================

-- ایندکس یکتا روی slug قبلاً با UNIQUE تعریف شده

-- ایندکس روی course_id (برای اتصال به جدول courses)
-- CREATE INDEX idx_lms_courses_course_id ON lms_courses(course_id);

-- ایندکس ترکیبی پرکاربرد: دسته + وضعیت + ویژه
-- CREATE INDEX idx_courses_category_status_featured ON lms_courses(category_id, status, is_featured) WHERE status = 'published';

-- ایندکس مدرس با دوره‌های منتشر شده
-- CREATE INDEX idx_courses_instructor_published ON lms_courses(instructor_id, status) WHERE status = 'published';

-- ایندکس قیمتی برای مرتب‌سازی و تخفیف
-- CREATE INDEX idx_courses_price_discount ON lms_courses(price, discount_price) WHERE status = 'published';

-- ایندکس سطح و مدت زمان
-- CREATE INDEX idx_courses_level_duration ON lms_courses(level, duration);

-- ایندکس زمانی برای جدیدترین دوره‌ها
-- CREATE INDEX idx_courses_created_at ON lms_courses(created_at DESC);

-- ایندکس روی آرایه تگ‌ها (GIN)
-- CREATE INDEX idx_courses_tags ON lms_courses USING gin(tags);

-- ایندکس روی meta_keywords (آرایه)
-- CREATE INDEX idx_courses_meta_keywords ON lms_courses USING gin(meta_keywords);

-- ایندکس روی فیلدهای JSONB
-- CREATE INDEX idx_courses_prerequisites_json ON lms_courses USING gin(prerequisites_json);
-- CREATE INDEX idx_courses_outcomes_json ON lms_courses USING gin(learning_outcomes_json);
-- CREATE INDEX idx_courses_extra_data ON lms_courses USING gin(extra_data);

-- ایندکس Full-Text Search (جستجوی متن کامل روی عنوان فارسی/انگلیسی و توضیحات)
-- CREATE INDEX idx_courses_search_gin ON lms_courses USING gin(to_tsvector('persian', coalesce(title, '') || ' ' || coalesce(title_fa, '') || ' ' || coalesce(description, ''))
--);

-- =============================================
-- 4. توابع و تریگرهای خودکار
-- =============================================

-- تابع به‌روزرسانی updated_at (قبلاً در بالای فایل تعریف شده)
-- تابع set_published_at (قبلاً در بالای فایل تعریف شده)

CREATE TRIGGER trg_lms_courses_updated_at
    BEFORE UPDATE ON lms_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lms_courses_published_at
    BEFORE UPDATE ON lms_courses
    FOR EACH ROW
    EXECUTE FUNCTION set_published_at();

-- =============================================
-- 5. کامنت‌های مستندسازی
-- =============================================

COMMENT ON TABLE lms_courses IS 'دوره‌های LMS (ترکیب کامل دو ساختار اولیه) با پشتیبانی از قیمت ارزی، تخفیف، تگ‌های آرایه‌ای، متادیتا، سئو، جستجوی متن کامل و داده‌های فراتن JSONB';
COMMENT ON COLUMN lms_courses.course_id IS 'ارجاع به جدول اصلی courses (از ساختار اول)';
COMMENT ON COLUMN lms_courses.slug IS 'نام مستند سئوپسند، یکتا';
COMMENT ON COLUMN lms_courses.tags IS 'آرایه‌ای از برچسب‌ها (جایگزین رشته کاما جدا)';
COMMENT ON COLUMN lms_courses.prerequisites_json IS 'پیش‌نیازها به صورت JSONB (مثلاً لیست ID دوره‌ها یا متن)';
COMMENT ON COLUMN lms_courses.learning_outcomes_json IS 'دستاوردهای یادگیری به صورت JSONB';
COMMENT ON COLUMN lms_courses.extra_data IS 'هر داده اضافی: وضعیت همایش، نیازمندی‌های فنی، فایل ضمیمه و ...';
COMMENT ON COLUMN lms_courses.meta_keywords IS 'آرایه کلمات کلیدی سئو';
COMMENT ON COLUMN lms_courses.is_published IS 'فیلد ساده boolean از جدول اول (برای سازگاری با کدهای قدیمی)';
COMMENT ON COLUMN lms_courses.status IS 'وضعیت دقیق دوره (پیش‌نویس، در انتظار بررسی، منتشر شده، بایگانی، حذف شده)';

-- جدول فصل‌ها
CREATE TABLE lms_chapters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_chapters_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_lms_chapters_course ON lms_chapters(course_id);

-- جدول جلسات (اپیزودها)
CREATE TABLE lms_episodes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    video_type video_type_enum DEFAULT 'youtube',
    duration INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    chapter_id INTEGER NULL,
    attachment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_episodes_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_episodes_chapter FOREIGN KEY (chapter_id) REFERENCES lms_chapters(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_lms_episodes_course ON lms_episodes(course_id);
-- CREATE INDEX idx_lms_episodes_order ON lms_episodes(order_index);
CREATE TRIGGER trg_lms_episodes_updated_at
    BEFORE UPDATE ON lms_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول ثبت‌نام کاربر در دوره
CREATE TABLE lms_course_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    last_watched_episode_id INTEGER NULL,
    last_watched_at TIMESTAMP NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_lms_course_user_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_course_user_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_course_user_last_episode FOREIGN KEY (last_watched_episode_id) REFERENCES lms_episodes(id) ON DELETE SET NULL,
    CONSTRAINT uk_lms_course_user_user_course UNIQUE (user_id, course_id)
);
-- CREATE INDEX idx_lms_course_user_user ON lms_course_user(user_id);
-- CREATE INDEX idx_lms_course_user_course ON lms_course_user(course_id);

-- جدول مشاهده جلسات
CREATE TABLE lms_episode_watches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    episode_id INTEGER NOT NULL,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watch_duration INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_lms_episode_watches_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_episode_watches_episode FOREIGN KEY (episode_id) REFERENCES lms_episodes(id) ON DELETE CASCADE,
    CONSTRAINT uk_lms_episode_watches_user_episode UNIQUE (user_id, episode_id)
);
-- CREATE INDEX idx_lms_episode_watches_user ON lms_episode_watches(user_id);
-- CREATE INDEX idx_lms_episode_watches_episode ON lms_episode_watches(episode_id);

-- جدول سفارش‌ها
CREATE TABLE lms_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount BIGINT NOT NULL,
    discount_amount BIGINT DEFAULT 0,
    final_amount BIGINT NOT NULL,
    status order_status_enum DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_gateway VARCHAR(50),
    coupon_code VARCHAR(50),
    coupon_id INTEGER NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_orders_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_lms_orders_user ON lms_orders(user_id);
-- CREATE INDEX idx_lms_orders_status ON lms_orders(status);
-- CREATE INDEX idx_lms_orders_order_number ON lms_orders(order_number);
CREATE TRIGGER trg_lms_orders_updated_at
    BEFORE UPDATE ON lms_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول آیتم‌های سفارش
CREATE TABLE lms_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    price_at_purchase BIGINT NOT NULL,
    discount_amount BIGINT DEFAULT 0,
    final_price BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_order_items_order FOREIGN KEY (order_id) REFERENCES lms_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_order_items_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE RESTRICT
);
-- CREATE INDEX idx_lms_order_items_order ON lms_order_items(order_id);
-- CREATE INDEX idx_lms_order_items_course ON lms_order_items(course_id);

-- جدول کوپن‌ها
CREATE TABLE lms_coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type_enum DEFAULT 'percent',
    discount_value BIGINT NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    min_purchase_amount BIGINT DEFAULT 0,
    applicable_courses JSONB,
    start_date TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_lms_coupons_code ON lms_coupons(code);
-- CREATE INDEX idx_lms_coupons_is_active ON lms_coupons(is_active);
-- CREATE INDEX idx_lms_coupons_expires_at ON lms_coupons(expires_at);
CREATE TRIGGER trg_lms_coupons_updated_at
    BEFORE UPDATE ON lms_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول استفاده از کوپن
CREATE TABLE lms_coupon_usages (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    discount_amount BIGINT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES lms_coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_coupon_usages_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_coupon_usages_order FOREIGN KEY (order_id) REFERENCES lms_orders(id) ON DELETE CASCADE,
    CONSTRAINT uk_lms_coupon_usages_coupon_order UNIQUE (coupon_id, order_id)
);
-- CREATE INDEX idx_lms_coupon_usages_coupon ON lms_coupon_usages(coupon_id);
-- CREATE INDEX idx_lms_coupon_usages_user ON lms_coupon_usages(user_id);

-- جدول نظرات
CREATE TABLE lms_comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    parent_id INTEGER NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    likes_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_comments_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_comments_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_comments_parent FOREIGN KEY (parent_id) REFERENCES lms_comments(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_lms_comments_course ON lms_comments(course_id);
-- CREATE INDEX idx_lms_comments_user ON lms_comments(user_id);
-- CREATE INDEX idx_lms_comments_is_approved ON lms_comments(is_approved);
-- CREATE INDEX idx_lms_comments_rating ON lms_comments(rating);
CREATE TRIGGER trg_lms_comments_updated_at
    BEFORE UPDATE ON lms_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- جدول لایک نظرات
CREATE TABLE lms_comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES lms_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_comment_likes_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT uk_lms_comment_likes_comment_user UNIQUE (comment_id, user_id)
);

-- جدول آزمون‌ها
CREATE TABLE lms_quizzes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    time_limit INTEGER NULL,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 1,
    is_final_exam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_quizzes_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE
);

-- جدول گواهینامه‌ها
CREATE TABLE lms_certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_lms_certificates_user FOREIGN KEY (user_id) REFERENCES lms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_certificates_course FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_lms_certificates_user_course UNIQUE (user_id, course_id)
);

-- =============================================
-- 6. ایندکس‌های بهبود عملکرد (خفن‌سازی)
-- =============================================
-- این ایندکس‌ها به صورت بهینه و بدون تغییر در منطق اصلی اضافه شده‌اند

-- ایندکس برای جستجوی کاربران فعال
CREATE INDEX IF NOT EXISTS idx_lms_users_is_active ON lms_users(is_active) WHERE is_active = true;

-- ایندکس ترکیبی برای دسته‌بندی‌های فعال و ترتیب
CREATE INDEX IF NOT EXISTS idx_lms_categories_active_order ON lms_categories(is_active, order_index);

-- ایندکس برای دوره‌های منتشر شده و ویژه
CREATE INDEX IF NOT EXISTS idx_lms_courses_published_featured ON lms_courses(status, is_featured) WHERE status = 'published';

-- ایندکس ترکیبی برای اپیزودها (دوره + ترتیب + رایگان بودن)
CREATE INDEX IF NOT EXISTS idx_lms_episodes_course_order_free ON lms_episodes(course_id, order_index, is_free);

-- ایندکس برای پیشرفت کاربران در دوره (برای گزارش‌گیری سریع)
CREATE INDEX IF NOT EXISTS idx_lms_course_user_completed ON lms_course_user(user_id, is_completed, progress);

-- ایندکس برای مشاهده جلسات بر اساس زمان (تحلیل رفتار کاربر)
CREATE INDEX IF NOT EXISTS idx_lms_episode_watches_watched_at ON lms_episode_watches(watched_at DESC);

-- ایندکس برای سفارش‌های پرداخت شده بر اساس زمان
CREATE INDEX IF NOT EXISTS idx_lms_orders_paid_at ON lms_orders(paid_at DESC) WHERE status = 'paid';

-- ایندکس برای کوپن‌های فعال و تاریخ انقضا
CREATE INDEX IF NOT EXISTS idx_lms_coupons_active_expires ON lms_coupons(is_active, expires_at) WHERE is_active = true;

-- ایندکس برای نظرات تایید شده با بالاترین امتیاز
CREATE INDEX IF NOT EXISTS idx_lms_comments_approved_rating ON lms_comments(course_id, rating) WHERE is_approved = true;

-- ایندکس برای جستجوی گواهینامه‌ها بر اساس شماره
CREATE INDEX IF NOT EXISTS idx_lms_certificates_number ON lms_certificates(certificate_number);

-- ۳۰. جدول LMS - محتوا
CREATE TABLE lms_contents (
    id SERIAL PRIMARY KEY,
    "lmsCourseId" INTEGER,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    "contentType" VARCHAR(30),
    content TEXT,
    "fileUrl" VARCHAR(500),
    "fileSize" INTEGER,
    "fileType" VARCHAR(50),
    duration INTEGER,
    "durationSeconds" INTEGER,
    "orderIndex" INTEGER DEFAULT 0,
    "isFree" BOOLEAN DEFAULT FALSE,
    "isPublished" BOOLEAN DEFAULT FALSE,
    description TEXT,
    attachments TEXT,
    "viewCount" INTEGER DEFAULT 0,
    "completionCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lms_contents_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_lms_contents_lmsCourseId ON lms_contents("lmsCourseId");
CREATE TRIGGER trg_lms_contents_updated_at
    BEFORE UPDATE ON lms_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۱. جدول LMS - تکالیف
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    "lmsCourseId" INTEGER,
    "sessionId" INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    file VARCHAR(500),
    "fileUrl" VARCHAR(500),
    "allowedFileTypes" VARCHAR(200),
    "maxFileSize" INTEGER,
    "dueDate" TIMESTAMP,
    "allowLateSubmission" BOOLEAN DEFAULT FALSE,
    "latePenalty" DECIMAL(5,2),
    "maxScore" DECIMAL(5,2),
    "passingScore" DECIMAL(5,2),
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_assignments_lmsCourseId ON assignments("lmsCourseId");
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۲. جدول LMS - ارسال تکالیف
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    "assignmentId" INTEGER,
    "studentId" BIGINT,
    content TEXT,
    "fileUrl" VARCHAR(500),
    "fileName" VARCHAR(200),
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "isLate" BOOLEAN DEFAULT FALSE,
    "latePenaltyApplied" DECIMAL(5,2) DEFAULT 0,
    score DECIMAL(5,2),
    "maxScore" DECIMAL(5,2),
    grade VARCHAR(5),
    feedback TEXT,
    "gradedBy" BIGINT,
    "gradedAt" TIMESTAMP,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submissions_assignment FOREIGN KEY ("assignmentId") REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_graded_by FOREIGN KEY ("gradedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_submissions_assignment_student UNIQUE ("assignmentId", "studentId")
);
-- CREATE INDEX idx_submissions_assignmentId ON submissions("assignmentId");
-- CREATE INDEX idx_submissions_studentId ON submissions("studentId");
CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۳. جدول LMS - آزمون‌ها
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    "lmsCourseId" INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(30),
    "timeLimit" INTEGER,
    "timeLimitUnit" VARCHAR(20),
    "randomizeQuestions" BOOLEAN DEFAULT FALSE,
    "randomizeAnswers" BOOLEAN DEFAULT FALSE,
    "showResults" BOOLEAN DEFAULT TRUE,
    "showCorrectAnswers" BOOLEAN DEFAULT FALSE,
    "showScore" BOOLEAN DEFAULT TRUE,
    "passingScore" DECIMAL(5,2),
    "maxAttempts" INTEGER DEFAULT 1,
    "allowReview" BOOLEAN DEFAULT TRUE,
    "totalQuestions" INTEGER DEFAULT 0,
    "totalScore" DECIMAL(5,2),
    "availableFrom" TIMESTAMP,
    "availableUntil" TIMESTAMP,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quizzes_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_quizzes_lmsCourseId ON quizzes("lmsCourseId");
CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۴. جدول LMS - سوالات آزمون
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    "quizId" INTEGER,
    question TEXT NOT NULL,
    "questionType" VARCHAR(30) DEFAULT 'multiple_choice',
    "questionMedia" TEXT,
    options JSONB,
    "correctAnswer" TEXT,
    "correctAnswers" JSONB,
    explanation TEXT,
    hint TEXT,
    score DECIMAL(5,2),
    "orderIndex" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_quiz_questions_quizId ON quiz_questions("quizId");

-- ۳۵. جدول LMS - نتایج آزمون
CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    "quizId" INTEGER,
    "studentId" BIGINT,
    score DECIMAL(5,2),
    "scorePercentage" DECIMAL(5,2),
    "correctAnswers" INTEGER,
    "wrongAnswers" INTEGER,
    "blankAnswers" INTEGER,
    "timeSpent" INTEGER,
    "timeSpentSeconds" INTEGER,
    answers JSONB,
    "questionResults" JSONB,
    passed BOOLEAN,
    "attemptNumber" INTEGER,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "takenAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_results_quiz FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_results_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_quiz_results_quiz_student_attempt UNIQUE ("quizId", "studentId", "attemptNumber")
);
-- CREATE INDEX idx_quiz_results_quizId ON quiz_results("quizId");
-- CREATE INDEX idx_quiz_results_studentId ON quiz_results("studentId");

-- ۳۶. جدول LMS - پیشرفت دانشجو
CREATE TABLE lms_progress (
    id SERIAL PRIMARY KEY,
    "lmsCourseId" INTEGER,
    "studentId" BIGINT,
    "progressPercentage" DECIMAL(5,2) DEFAULT 0,
    "completedContents" JSONB,
    "completedContentIds" JSONB,
    "timeSpent" INTEGER,
    "lastContentId" INTEGER,
    "lastAccessedAt" TIMESTAMP,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP,
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    "certificateUrl" VARCHAR(500),
    "certificateIssuedAt" TIMESTAMP,
    CONSTRAINT fk_lms_progress_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_progress_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lms_progress_last_content FOREIGN KEY ("lastContentId") REFERENCES lms_contents(id) ON DELETE SET NULL,
    CONSTRAINT uk_lms_progress_course_student UNIQUE ("lmsCourseId", "studentId")
);
-- CREATE INDEX idx_lms_progress_lmsCourseId ON lms_progress("lmsCourseId");
-- CREATE INDEX idx_lms_progress_studentId ON lms_progress("studentId");

-- ۳۷. جدول منابع آموزشی
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    "fileUrl" VARCHAR(500),
    "fileSize" BIGINT,
    "fileType" VARCHAR(50),
    "mimeType" VARCHAR(100),
    thumbnail VARCHAR(500),
    "uploadedBy" BIGINT,
    "courseId" INTEGER,
    "lmsCourseId" INTEGER,
    tags VARCHAR(200),
    keywords VARCHAR(300),
    "downloadCount" INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "likeCount" INTEGER DEFAULT 0,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resources_uploaded_by FOREIGN KEY ("uploadedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_resources_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_resources_lms_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_resources_type ON resources(type);
-- CREATE INDEX idx_resources_category ON resources(category);
-- CREATE INDEX idx_resources_uploadedBy ON resources("uploadedBy");
CREATE TRIGGER trg_resources_updated_at
    BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۸. جدول بحث و گفتگو
CREATE TABLE discussions (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER,
    "lmsCourseId" INTEGER,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    "authorId" BIGINT,
    "authorRole" VARCHAR(30),
    "isPinned" BOOLEAN DEFAULT FALSE,
    "isLocked" BOOLEAN DEFAULT FALSE,
    "isAnnouncement" BOOLEAN DEFAULT FALSE,
    "viewCount" INTEGER DEFAULT 0,
    "replyCount" INTEGER DEFAULT 0,
    "likeCount" INTEGER DEFAULT 0,
    "lastReplyAt" TIMESTAMP,
    "lastReplyBy" BIGINT,
    tags VARCHAR(200),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discussions_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussions_lms_course FOREIGN KEY ("lmsCourseId") REFERENCES lms_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussions_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_discussions_last_reply_by FOREIGN KEY ("lastReplyBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_discussions_courseId ON discussions("courseId");
-- CREATE INDEX idx_discussions_lmsCourseId ON discussions("lmsCourseId");
-- CREATE INDEX idx_discussions_authorId ON discussions("authorId");
CREATE TRIGGER trg_discussions_updated_at
    BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۳۹. جدول پاسخ‌های بحث
CREATE TABLE discussion_replies (
    id SERIAL PRIMARY KEY,
    "discussionId" INTEGER,
    "parentId" INTEGER,
    "authorId" BIGINT,
    content TEXT NOT NULL,
    "isBestAnswer" BOOLEAN DEFAULT FALSE,
    "likeCount" INTEGER DEFAULT 0,
    "likedBy" JSONB,
    "isEdited" BOOLEAN DEFAULT FALSE,
    "editedAt" TIMESTAMP,
    "editedBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discussion_replies_discussion FOREIGN KEY ("discussionId") REFERENCES discussions(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_replies_parent FOREIGN KEY ("parentId") REFERENCES discussion_replies(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_replies_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_discussion_replies_edited_by FOREIGN KEY ("editedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_discussion_replies_discussionId ON discussion_replies("discussionId");
-- CREATE INDEX idx_discussion_replies_parentId ON discussion_replies("parentId");
-- CREATE INDEX idx_discussion_replies_authorId ON discussion_replies("authorId");
CREATE TRIGGER trg_discussion_replies_updated_at
    BEFORE UPDATE ON discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۴۰. جدول اطلاعیه‌ها
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    content TEXT,
    summary VARCHAR(300),
    type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    "senderId" BIGINT,
    "senderRole" VARCHAR(30),
    "targetRoles" JSONB,
    "targetDepartments" JSONB,
    "targetFaculties" JSONB,
    "targetCourses" JSONB,
    "targetUsers" JSONB,
    "targetSpecific" JSONB,
    attachment VARCHAR(500),
    attachments JSONB,
    "publishDate" TIMESTAMP,
    "expireDate" TIMESTAMP,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "viewCount" INTEGER DEFAULT 0,
    "viewedBy" JSONB,
    "isEmailSent" BOOLEAN DEFAULT FALSE,
    "isSmsSent" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_announcements_type ON announcements(type);
-- CREATE INDEX idx_announcements_priority ON announcements(priority);
-- CREATE INDEX idx_announcements_senderId ON announcements("senderId");
-- CREATE INDEX idx_announcements_isPublished ON announcements("isPublished");
CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۴۱. جدول پیام‌های داخلی
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    "senderId" BIGINT,
    "senderDeletedAt" TIMESTAMP,
    "receiverId" BIGINT,
    "receiverDeletedAt" TIMESTAMP,
    subject VARCHAR(200),
    body TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "readAt" TIMESTAMP,
    "isStarred" BOOLEAN DEFAULT FALSE,
    "isArchived" BOOLEAN DEFAULT FALSE,
    "isImportant" BOOLEAN DEFAULT FALSE,
    "parentId" INTEGER,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_messages_receiver FOREIGN KEY ("receiverId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_messages_parent FOREIGN KEY ("parentId") REFERENCES messages(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_messages_senderId ON messages("senderId");
-- CREATE INDEX idx_messages_receiverId ON messages("receiverId");
-- CREATE INDEX idx_messages_isRead ON messages("isRead");

-- ۴۲. جدول اعلان‌ها


-- ۴۳. جدول OTP و تأیید
CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    code VARCHAR(10) NOT NULL,
    type VARCHAR(30) NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "usedAt" TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    attempts INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
-- CREATE INDEX idx_otp_codes_type ON otp_codes(type);
-- CREATE INDEX idx_otp_codes_expiresAt ON otp_codes("expiresAt");

-- ۴۴. جدول جستجو دانشجویان
CREATE TABLE student_search_log (
    id SERIAL PRIMARY KEY,
    "searchedBy" BIGINT,
    "searchType" VARCHAR(30),
    "searchQuery" VARCHAR(200),
    filters JSONB,
    "resultsCount" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_search_log_searched_by FOREIGN KEY ("searchedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_search_log_searchedBy ON student_search_log("searchedBy");
-- CREATE INDEX idx_student_search_log_createdAt ON student_search_log("createdAt");

-- ۴۵. جدول گزارش ورود کاربران
CREATE TABLE login_logs (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    username VARCHAR(100),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    location VARCHAR(200),
    "locationCoords" POINT,
    success BOOLEAN DEFAULT TRUE,
    "failureReason" VARCHAR(200),
    "loginMethod" VARCHAR(30),
    "twoFactorVerified" BOOLEAN DEFAULT FALSE,
    "sessionId" VARCHAR(100),
    "tokenId" VARCHAR(100),
    "loggedInAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "loggedOutAt" TIMESTAMP,
    CONSTRAINT fk_login_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_login_logs_userId ON login_logs("userId");
-- CREATE INDEX idx_login_logs_loggedInAt ON login_logs("loggedInAt");
-- CREATE INDEX idx_login_logs_ipAddress ON login_logs("ipAddress");

-- ۴۶. جدول نقش‌ها و سطوح دسترسی
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    "nameFa" VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    "descriptionFa" VARCHAR(255),
    level INTEGER DEFAULT 1,
    "parentId" INTEGER,
    color VARCHAR(20),
    icon VARCHAR(50),
    permissions JSONB,
    "isSystem" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roles_parent FOREIGN KEY ("parentId") REFERENCES roles(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roles_name ON roles(name);
-- CREATE INDEX idx_roles_level ON roles(level);
CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۴۷. جدول مجوزهای کامل
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    "moduleFa" VARCHAR(50),
    description VARCHAR(255),
    "descriptionFa" VARCHAR(255),
    type VARCHAR(20) DEFAULT 'access',
    category VARCHAR(50),
    "isSystem" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_permissions_module ON permissions(module);
-- CREATE INDEX idx_permissions_category ON permissions(category);

-- ۴۸. جدول ارتباط نقش و مجوز
CREATE TABLE role_permissions (
    "roleId" INTEGER,
    "permissionId" INTEGER,
    "grantedBy" BIGINT,
    "grantedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_granted_by FOREIGN KEY ("grantedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- ۴۹. جدول کاربران و نقش‌های اضافی
CREATE TABLE user_roles (
    "userId" BIGINT,
    "roleId" INTEGER,
    "assignedBy" BIGINT,
    "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE,
    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT fk_user_roles_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY ("assignedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_user_roles_userId ON user_roles("userId");
-- CREATE INDEX idx_user_roles_roleId ON user_roles("roleId");

-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۵۰ تا ۷۱)
-- ═══════════════════════════════════════════════════════════════════════

-- ۵۰. جدول جلسات (Sessions)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    token VARCHAR(500) UNIQUE,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    location VARCHAR(200),
    "isActive" BOOLEAN DEFAULT TRUE,
    "expiresAt" TIMESTAMP,
    "lastActivity" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_sessions_userId ON sessions("userId");
-- CREATE INDEX idx_sessions_token ON sessions(token);
-- CREATE INDEX idx_sessions_isActive ON sessions("isActive");
-- CREATE INDEX idx_sessions_expiresAt ON sessions("expiresAt");

-- ۵۱. جدول تقویم و رویدادها
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    color VARCHAR(20),
    icon VARCHAR(50),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "allDay" BOOLEAN DEFAULT FALSE,
    recurring BOOLEAN DEFAULT FALSE,
    "recurrenceRule" VARCHAR(200),
    location VARCHAR(200),
    "onlineLink" VARCHAR(500),
    "isOnline" BOOLEAN DEFAULT FALSE,
    "organizerId" BIGINT,
    "organizerRole" VARCHAR(50),
    "departmentId" INTEGER,
    "facultyId" INTEGER,
    "targetRoles" JSONB,
    "targetUsers" JSONB,
    "targetCourses" JSONB,
    capacity INTEGER,
    "enrolledCount" INTEGER DEFAULT 0,
    "registrationRequired" BOOLEAN DEFAULT FALSE,
    "registrationStart" TIMESTAMP,
    "registrationEnd" TIMESTAMP,
    attachment VARCHAR(500),
    attachments JSONB,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isCancelled" BOOLEAN DEFAULT FALSE,
    "cancellationReason" TEXT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_events_type ON events(type);
-- CREATE INDEX idx_events_category ON events(category);
-- CREATE INDEX idx_events_startDate ON events("startDate");
-- CREATE INDEX idx_events_organizerId ON events("organizerId");
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۲. جدول ثبت‌نام رویدادها
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    "eventId" INTEGER,
    "userId" BIGINT,
    "registrationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    "attendanceStatus" VARCHAR(20) DEFAULT 'pending',
    "checkInTime" TIMESTAMP,
    "checkOutTime" TIMESTAMP,
    feedback TEXT,
    rating INTEGER,
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    notes TEXT,
    CONSTRAINT fk_event_registrations_event FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_registrations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_event_registrations_event_user UNIQUE ("eventId", "userId")
);
-- CREATE INDEX idx_event_registrations_eventId ON event_registrations("eventId");
-- CREATE INDEX idx_event_registrations_userId ON event_registrations("userId");

-- ۵۳. جدول کتابخانه
CREATE TABLE library_books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    authors JSONB,
    translators JSONB,
    publishers JSONB,
    "publishYear" INTEGER,
    edition VARCHAR(50),
    language VARCHAR(30),
    pages INTEGER,
    dimensions VARCHAR(50),
    weight DECIMAL(6,2),
    price DECIMAL(12,2),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    keywords JSONB,
    abstract TEXT,
    "coverImage" VARCHAR(500),
    "tableOfContents" TEXT,
    subjects JSONB,
    "ddcCode" VARCHAR(20),
    location VARCHAR(100),
    shelf VARCHAR(50),
    "copyNumber" VARCHAR(20),
    "totalCopies" INTEGER DEFAULT 1,
    "availableCopies" INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'available',
    "isDigital" BOOLEAN DEFAULT FALSE,
    "digitalLink" VARCHAR(500),
    "isReference" BOOLEAN DEFAULT FALSE,
    "isRare" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_library_books_isbn ON library_books(isbn);
-- CREATE INDEX idx_library_books_title ON library_books(title);
-- CREATE INDEX idx_library_books_category ON library_books(category);
-- CREATE INDEX idx_library_books_ddcCode ON library_books("ddcCode");
CREATE TRIGGER trg_library_books_updated_at
    BEFORE UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۴. جدول امانت کتاب
CREATE TABLE library_borrowings (
    id SERIAL PRIMARY KEY,
    "bookId" INTEGER,
    "userId" BIGINT,
    "borrowDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE NOT NULL,
    "returnDate" TIMESTAMP,
    "actualReturnDate" TIMESTAMP,
    "renewalCount" INTEGER DEFAULT 0,
    "maxRenewals" INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'borrowed',
    "lateFee" DECIMAL(10,2) DEFAULT 0,
    "lateFeePaid" BOOLEAN DEFAULT FALSE,
    penalty DECIMAL(10,2) DEFAULT 0,
    "penaltyReason" TEXT,
    "penaltyPaid" BOOLEAN DEFAULT FALSE,
    notes TEXT,
    "borrowedBy" BIGINT,
    "returnedTo" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_library_borrowings_book FOREIGN KEY ("bookId") REFERENCES library_books(id) ON DELETE CASCADE,
    CONSTRAINT fk_library_borrowings_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_library_borrowings_borrowed_by FOREIGN KEY ("borrowedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_library_borrowings_returned_to FOREIGN KEY ("returnedTo") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_library_borrowings_bookId ON library_borrowings("bookId");
-- CREATE INDEX idx_library_borrowings_userId ON library_borrowings("userId");
-- CREATE INDEX idx_library_borrowings_status ON library_borrowings(status);
-- CREATE INDEX idx_library_borrowings_dueDate ON library_borrowings("dueDate");
CREATE TRIGGER trg_library_borrowings_updated_at
    BEFORE UPDATE ON library_borrowings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۵. جدول رزرو کتابخانه
CREATE TABLE library_reservations (
    id SERIAL PRIMARY KEY,
    "bookId" INTEGER,
    "userId" BIGINT,
    "reservationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    "notificationSent" BOOLEAN DEFAULT FALSE,
    "fulfilledAt" TIMESTAMP,
    "cancelledAt" TIMESTAMP,
    "cancelReason" TEXT,
    CONSTRAINT fk_library_reservations_book FOREIGN KEY ("bookId") REFERENCES library_books(id) ON DELETE CASCADE,
    CONSTRAINT fk_library_reservations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- نکته: UNIQUE با شرط status در MySQL با PostgreSQL سازگار نیست. برای حفظ سازگاری، از یک ایندکس جزئی استفاده می‌کنیم.
CREATE UNIQUE INDEX uk_library_reservations_book_user_active 
    ON library_reservations ("bookId", "userId") 
    WHERE status IN ('pending', 'active');
-- CREATE INDEX idx_library_reservations_bookId ON library_reservations("bookId");
-- CREATE INDEX idx_library_reservations_userId ON library_reservations("userId");
-- CREATE INDEX idx_library_reservations_status ON library_reservations(status);

-- ۵۶. جدول خوابگاه
CREATE TABLE dormitories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    type VARCHAR(50),
    gender VARCHAR(10),
    address VARCHAR(300),
    "buildingCount" INTEGER DEFAULT 1,
    "floorCount" INTEGER DEFAULT 1,
    "totalRooms" INTEGER DEFAULT 0,
    "totalCapacity" INTEGER DEFAULT 0,
    "managerId" BIGINT,
    "supervisorId" BIGINT,
    phone VARCHAR(20),
    email VARCHAR(100),
    facilities JSONB,
    rules TEXT,
    images JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dormitories_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_dormitories_supervisor FOREIGN KEY ("supervisorId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_dormitories_type ON dormitories(type);
-- CREATE INDEX idx_dormitories_gender ON dormitories(gender);
CREATE TRIGGER trg_dormitories_updated_at
    BEFORE UPDATE ON dormitories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۷. جدول اتاق‌های خوابگاه
CREATE TABLE dormitory_rooms (
    id SERIAL PRIMARY KEY,
    "dormitoryId" INTEGER,
    building VARCHAR(20),
    floor INTEGER,
    "roomNumber" VARCHAR(20) NOT NULL,
    "roomType" VARCHAR(30),
    capacity INTEGER DEFAULT 1,
    "currentOccupancy" INTEGER DEFAULT 0,
    gender VARCHAR(10),
    amenities JSONB,
    facilities JSONB,
    status VARCHAR(20) DEFAULT 'available',
    "monthlyFee" DECIMAL(10,2),
    description TEXT,
    images JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dormitory_rooms_dormitory FOREIGN KEY ("dormitoryId") REFERENCES dormitories(id) ON DELETE CASCADE,
    CONSTRAINT uk_dormitory_rooms_dormitory_room UNIQUE ("dormitoryId", "roomNumber")
);
-- CREATE INDEX idx_dormitory_rooms_status ON dormitory_rooms(status);
-- CREATE INDEX idx_dormitory_rooms_gender ON dormitory_rooms(gender);
CREATE TRIGGER trg_dormitory_rooms_updated_at
    BEFORE UPDATE ON dormitory_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۸. جدول ساکنین خوابگاه
CREATE TABLE dormitory_residents (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "roomId" INTEGER,
    "academicTermId" INTEGER,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    status VARCHAR(20) DEFAULT 'active',
    "bedNumber" VARCHAR(10),
    "checkInDate" TIMESTAMP,
    "checkOutDate" TIMESTAMP,
    "checkOutReason" TEXT,
    "monthlyFee" DECIMAL(10,2),
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentMethod" VARCHAR(30),
    "transactionId" VARCHAR(50),
    "paymentDate" TIMESTAMP,
    balance DECIMAL(10,2) DEFAULT 0,
    "depositAmount" DECIMAL(10,2),
    "depositReturned" BOOLEAN DEFAULT FALSE,
    "depositReturnDate" TIMESTAMP,
    "violationsCount" INTEGER DEFAULT 0,
    "warningsCount" INTEGER DEFAULT 0,
    notes TEXT,
    "registeredBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dormitory_residents_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dormitory_residents_room FOREIGN KEY ("roomId") REFERENCES dormitory_rooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_dormitory_residents_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_dormitory_residents_registered_by FOREIGN KEY ("registeredBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_dormitory_residents_userId ON dormitory_residents("userId");
-- CREATE INDEX idx_dormitory_residents_roomId ON dormitory_residents("roomId");
-- CREATE INDEX idx_dormitory_residents_status ON dormitory_residents(status);
CREATE TRIGGER trg_dormitory_residents_updated_at
    BEFORE UPDATE ON dormitory_residents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۵۹. جدول تخلفات خوابگاهی
CREATE TABLE dormitory_violations (
    id SERIAL PRIMARY KEY,
    "residentId" INTEGER,
    "roomId" INTEGER,
    "violationType" VARCHAR(50) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    "actionTaken" TEXT,
    "fineAmount" DECIMAL(10,2),
    "finePaid" BOOLEAN DEFAULT FALSE,
    "warningIssued" BOOLEAN DEFAULT FALSE,
    "reportedBy" BIGINT,
    "reportDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "resolvedBy" BIGINT,
    "resolvedAt" TIMESTAMP,
    resolution TEXT,
    attachments JSONB,
    CONSTRAINT fk_dormitory_violations_resident FOREIGN KEY ("residentId") REFERENCES dormitory_residents(id) ON DELETE CASCADE,
    CONSTRAINT fk_dormitory_violations_room FOREIGN KEY ("roomId") REFERENCES dormitory_rooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_dormitory_violations_reported_by FOREIGN KEY ("reportedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_dormitory_violations_resolved_by FOREIGN KEY ("resolvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_dormitory_violations_residentId ON dormitory_violations("residentId");
-- CREATE INDEX idx_dormitory_violations_violationType ON dormitory_violations("violationType");
-- CREATE INDEX idx_dormitory_violations_severity ON dormitory_violations(severity);

-- ۶۰. جدول حمل‌ونقل (وسایل نقلیه)
CREATE TABLE transport_vehicles (
    id SERIAL PRIMARY KEY,
    "plateNumber" VARCHAR(20) UNIQUE NOT NULL,
    "vehicleType" VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    capacity INTEGER,
    color VARCHAR(30),
    vin VARCHAR(50),
    "insuranceExpiry" DATE,
    "technicalInspectionExpiry" DATE,
    "driverId" BIGINT,
    status VARCHAR(20) DEFAULT 'active',
    "lastMaintenance" DATE,
    "nextMaintenance" DATE,
    mileage INTEGER DEFAULT 0,
    "fuelType" VARCHAR(20),
    "fuelCapacity" DECIMAL(6,2),
    "currentFuel" DECIMAL(6,2),
    amenities JSONB,
    image VARCHAR(500),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transport_vehicles_driver FOREIGN KEY ("driverId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_transport_vehicles_status ON transport_vehicles(status);
-- CREATE INDEX idx_transport_vehicles_driverId ON transport_vehicles("driverId");
CREATE TRIGGER trg_transport_vehicles_updated_at
    BEFORE UPDATE ON transport_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۱. جدول مسیرهای حمل‌ونقل
CREATE TABLE transport_routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    type VARCHAR(50),
    origin VARCHAR(200),
    destination VARCHAR(200),
    waypoints JSONB,
    distance DECIMAL(10,2),
    "estimatedTime" INTEGER,
    stops JSONB,
    schedule JSONB,
    fare DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_transport_routes_type ON transport_routes(type);
-- CREATE INDEX idx_transport_routes_isActive ON transport_routes("isActive");
CREATE TRIGGER trg_transport_routes_updated_at
    BEFORE UPDATE ON transport_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۲. جدول سرویس دانشجویی
CREATE TABLE transport_services (
    id SERIAL PRIMARY KEY,
    "routeId" INTEGER,
    "vehicleId" INTEGER,
    "driverId" BIGINT,
    "academicTermId" INTEGER,
    "serviceType" VARCHAR(50),
    "departureTime" TIME NOT NULL,
    "returnTime" TIME,
    "daysOfWeek" JSONB,
    capacity INTEGER,
    "currentPassengers" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    "startDate" DATE,
    "endDate" DATE,
    fare DECIMAL(10,2),
    "paymentType" VARCHAR(20),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transport_services_route FOREIGN KEY ("routeId") REFERENCES transport_routes(id) ON DELETE SET NULL,
    CONSTRAINT fk_transport_services_vehicle FOREIGN KEY ("vehicleId") REFERENCES transport_vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_transport_services_driver FOREIGN KEY ("driverId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_transport_services_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_transport_services_routeId ON transport_services("routeId");
-- CREATE INDEX idx_transport_services_vehicleId ON transport_services("vehicleId");
-- CREATE INDEX idx_transport_services_status ON transport_services(status);
CREATE TRIGGER trg_transport_services_updated_at
    BEFORE UPDATE ON transport_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۳. جدول ثبت‌نام سرویس
CREATE TABLE transport_subscriptions (
    id SERIAL PRIMARY KEY,
    "serviceId" INTEGER,
    "userId" BIGINT,
    "academicTermId" INTEGER,
    "subscriptionType" VARCHAR(50),
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    status VARCHAR(20) DEFAULT 'active',
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentAmount" DECIMAL(10,2),
    "paymentDate" TIMESTAMP,
    "transactionId" VARCHAR(50),
    "paymentMethod" VARCHAR(30),
    "attendanceCount" INTEGER DEFAULT 0,
    "absenceCount" INTEGER DEFAULT 0,
    notes TEXT,
    "registeredBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transport_subscriptions_service FOREIGN KEY ("serviceId") REFERENCES transport_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_transport_subscriptions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transport_subscriptions_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_transport_subscriptions_registered_by FOREIGN KEY ("registeredBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_transport_subscriptions_service_user_term UNIQUE ("serviceId", "userId", "academicTermId")
);
-- CREATE INDEX idx_transport_subscriptions_serviceId ON transport_subscriptions("serviceId");
-- CREATE INDEX idx_transport_subscriptions_userId ON transport_subscriptions("userId");
-- CREATE INDEX idx_transport_subscriptions_status ON transport_subscriptions(status);
CREATE TRIGGER trg_transport_subscriptions_updated_at
    BEFORE UPDATE ON transport_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۴. جدول حضور در سرویس
CREATE TABLE transport_attendance (
    id SERIAL PRIMARY KEY,
    "subscriptionId" INTEGER,
    "serviceId" INTEGER,
    "userId" BIGINT,
    "attendanceDate" DATE NOT NULL,
    "pickupTime" TIME,
    "pickupLocation" VARCHAR(200),
    "dropoffTime" TIME,
    "dropoffLocation" VARCHAR(200),
    status VARCHAR(20) DEFAULT 'present',
    remarks TEXT,
    "recordedBy" BIGINT,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transport_attendance_subscription FOREIGN KEY ("subscriptionId") REFERENCES transport_subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_transport_attendance_service FOREIGN KEY ("serviceId") REFERENCES transport_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_transport_attendance_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transport_attendance_recorded_by FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_transport_attendance_subscription_date UNIQUE ("subscriptionId", "attendanceDate")
);
-- CREATE INDEX idx_transport_attendance_serviceId ON transport_attendance("serviceId");
-- CREATE INDEX idx_transport_attendance_userId ON transport_attendance("userId");
-- CREATE INDEX idx_transport_attendance_attendanceDate ON transport_attendance("attendanceDate");

-- ۶۵. جدول خدمات بهداشتی
CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "bloodType" VARCHAR(5),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(4,2),
    allergies JSONB,
    "chronicDiseases" JSONB,
    medications JSONB,
    surgeries JSONB,
    "familyMedicalHistory" TEXT,
    "emergencyContactName" VARCHAR(100),
    "emergencyContactPhone" VARCHAR(20),
    "emergencyContactRelation" VARCHAR(50),
    "insuranceProvider" VARCHAR(100),
    "insuranceNumber" VARCHAR(50),
    "insuranceExpiry" DATE,
    "lastCheckup" DATE,
    "lastDentalCheckup" DATE,
    "visionLeft" DECIMAL(4,2),
    "visionRight" DECIMAL(4,2),
    "hearingStatus" VARCHAR(20),
    "physicalCondition" VARCHAR(50),
    "mentalHealthStatus" VARCHAR(50),
    "vaccinationRecords" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_records_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_health_records_userId ON health_records("userId");
CREATE TRIGGER trg_health_records_updated_at
    BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۶. جدول ویزیت‌های پزشکی
CREATE TABLE health_visits (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "visitType" VARCHAR(50) NOT NULL,
    "visitDate" TIMESTAMP NOT NULL,
    "physicianId" BIGINT,
    department VARCHAR(50),
    "chiefComplaint" TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    recommendations TEXT,
    "followUpDate" DATE,
    "followUpRequired" BOOLEAN DEFAULT FALSE,
    "vitalSigns" JSONB,
    "labTests" JSONB,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'completed',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_visits_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_health_visits_physician FOREIGN KEY ("physicianId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_health_visits_userId ON health_visits("userId");
-- CREATE INDEX idx_health_visits_visitDate ON health_visits("visitDate");
-- CREATE INDEX idx_health_visits_physicianId ON health_visits("physicianId");
CREATE TRIGGER trg_health_visits_updated_at
    BEFORE UPDATE ON health_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۷. جدول درخواست‌های مرخصی پزشکی
CREATE TABLE medical_leaves (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "leaveType" VARCHAR(50) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    reason TEXT,
    "physicianName" VARCHAR(100),
    "physicianLicense" VARCHAR(50),
    "medicalCenter" VARCHAR(200),
    "medicalReportUrl" VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_leaves_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_medical_leaves_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_medical_leaves_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_medical_leaves_userId ON medical_leaves("userId");
-- CREATE INDEX idx_medical_leaves_status ON medical_leaves(status);
-- CREATE INDEX idx_medical_leaves_startDate ON medical_leaves("startDate");
CREATE TRIGGER trg_medical_leaves_updated_at
    BEFORE UPDATE ON medical_leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۸. جدول مالی و حسابداری
CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    "transactionNumber" VARCHAR(50) UNIQUE NOT NULL,
    "transactionType" VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IRR',
    "exchangeRate" DECIMAL(10,4) DEFAULT 1,
    "amountUSD" DECIMAL(15,2),
    "userId" BIGINT,
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" BIGINT,
    "paymentMethod" VARCHAR(30),
    "paymentGateway" VARCHAR(50),
    "gatewayTransactionId" VARCHAR(100),
    "referenceNumber" VARCHAR(100),
    description TEXT,
    "descriptionFa" TEXT,
    attachment VARCHAR(500),
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_financial_transactions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_financial_transactions_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_financial_transactions_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_financial_transactions_transactionType ON financial_transactions("transactionType");
-- CREATE INDEX idx_financial_transactions_category ON financial_transactions(category);
-- CREATE INDEX idx_financial_transactions_userId ON financial_transactions("userId");
-- CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
-- CREATE INDEX idx_financial_transactions_createdAt ON financial_transactions("createdAt");
CREATE TRIGGER trg_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۶۹. جدول فاکتورها
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
    "invoiceType" VARCHAR(50) NOT NULL,
    "userId" BIGINT,
    "academicTermId" INTEGER,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE,
    items JSONB NOT NULL,
    subtotal DECIMAL(15,2),
    "taxAmount" DECIMAL(15,2) DEFAULT 0,
    "discountAmount" DECIMAL(15,2) DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IRR',
    status VARCHAR(20) DEFAULT 'draft',
    "paidAmount" DECIMAL(15,2) DEFAULT 0,
    "paidAt" TIMESTAMP,
    "paymentMethod" VARCHAR(30),
    "paymentGateway" VARCHAR(50),
    "transactionId" VARCHAR(100),
    notes TEXT,
    terms TEXT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_invoices_invoiceType ON invoices("invoiceType");
-- CREATE INDEX idx_invoices_userId ON invoices("userId");
-- CREATE INDEX idx_invoices_status ON invoices(status);
-- CREATE INDEX idx_invoices_issueDate ON invoices("issueDate");
CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۷۰. جدول بودجه
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    "academicTermId" INTEGER,
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "budgetType" VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "allocatedAmount" DECIMAL(15,2) NOT NULL,
    "spentAmount" DECIMAL(15,2) DEFAULT 0,
    "remainingAmount" DECIMAL(15,2),
    "startDate" DATE,
    "endDate" DATE,
    status VARCHAR(20) DEFAULT 'active',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budgets_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_budgets_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_budgets_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_budgets_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_budgets_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_budgets_academicTermId ON budgets("academicTermId");
-- CREATE INDEX idx_budgets_facultyId ON budgets("facultyId");
-- CREATE INDEX idx_budgets_budgetType ON budgets("budgetType");
-- CREATE INDEX idx_budgets_status ON budgets(status);
CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۷۱. جدول انبار و تجهیزات
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    "serialNumber" VARCHAR(100),
    barcode VARCHAR(100),
    description TEXT,
    specifications JSONB,
    unit VARCHAR(20),
    "unitPrice" DECIMAL(12,2),
    quantity INTEGER DEFAULT 0,
    "minQuantity" INTEGER DEFAULT 0,
    "maxQuantity" INTEGER,
    location VARCHAR(200),
    "storageLocation" VARCHAR(100),
    supplier VARCHAR(200),
    "supplierContact" VARCHAR(200),
    "warrantyExpiry" DATE,
    image VARCHAR(500),
    images JSONB,
    "isConsumable" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_inventory_items_code ON inventory_items(code);
-- CREATE INDEX idx_inventory_items_category ON inventory_items(category);
-- CREATE INDEX idx_inventory_items_name ON inventory_items(name);
-- CREATE INDEX idx_inventory_items_isActive ON inventory_items("isActive");
CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۷۲ تا ۹۰)
-- ═══════════════════════════════════════════════════════════════════════

-- ۷۲. جدول ورود و خروج کالا
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    "itemId" INTEGER,
    "transactionType" VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "totalPrice" DECIMAL(15,2),
    "referenceType" VARCHAR(50),
    "referenceId" BIGINT,
    "fromLocation" VARCHAR(200),
    "toLocation" VARCHAR(200),
    "requestedBy" BIGINT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    attachment VARCHAR(500),
    "transactionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_transactions_item FOREIGN KEY ("itemId") REFERENCES inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_transactions_requested_by FOREIGN KEY ("requestedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_transactions_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_transactions_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_inventory_transactions_itemId ON inventory_transactions("itemId");
-- CREATE INDEX idx_inventory_transactions_transactionType ON inventory_transactions("transactionType");
-- CREATE INDEX idx_inventory_transactions_status ON inventory_transactions(status);
-- CREATE INDEX idx_inventory_transactions_transactionDate ON inventory_transactions("transactionDate");

-- ۷۳. جدول نظرسنجی‌ها
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    "targetType" VARCHAR(50),
    "targetRoles" JSONB,
    "targetDepartments" JSONB,
    "targetFaculties" JSONB,
    "targetCourses" JSONB,
    "targetUsers" JSONB,
    questions JSONB NOT NULL,
    settings JSONB,
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "isAnonymous" BOOLEAN DEFAULT FALSE,
    "allowMultipleResponses" BOOLEAN DEFAULT FALSE,
    "showResults" BOOLEAN DEFAULT FALSE,
    "notifyParticipants" BOOLEAN DEFAULT FALSE,
    "responseCount" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_surveys_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_surveys_type ON surveys(type);
-- CREATE INDEX idx_surveys_status ON surveys(status);
-- CREATE INDEX idx_surveys_createdBy ON surveys("createdBy");
CREATE TRIGGER trg_surveys_updated_at
    BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۷۴. جدول پاسخ‌های نظرسنجی
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    "surveyId" INTEGER,
    "userId" BIGINT,
    responses JSONB NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_survey_responses_survey FOREIGN KEY ("surveyId") REFERENCES surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_responses_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_survey_responses_survey_user UNIQUE ("surveyId", "userId")
);
-- CREATE INDEX idx_survey_responses_surveyId ON survey_responses("surveyId");
-- CREATE INDEX idx_survey_responses_userId ON survey_responses("userId");
-- CREATE INDEX idx_survey_responses_submittedAt ON survey_responses("submittedAt");

-- ۷۵. جدول ارزیابی اساتید
CREATE TABLE professor_evaluations (
    id SERIAL PRIMARY KEY,
    "professorId" BIGINT,
    "studentId" BIGINT,
    "courseId" INTEGER,
    "academicTermId" INTEGER,
    criteria JSONB NOT NULL,
    "overallRating" DECIMAL(3,2),
    comments TEXT,
    suggestions TEXT,
    "isAnonymous" BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'pending',
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_professor_evaluations_professor FOREIGN KEY ("professorId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_professor_evaluations_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_professor_evaluations_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_professor_evaluations_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT uk_professor_evaluations_prof_student_term UNIQUE ("professorId", "studentId", "academicTermId")
);
-- CREATE INDEX idx_professor_evaluations_professorId ON professor_evaluations("professorId");
-- CREATE INDEX idx_professor_evaluations_academicTermId ON professor_evaluations("academicTermId");
-- CREATE INDEX idx_professor_evaluations_submittedAt ON professor_evaluations("submittedAt");

-- ۷۶. جدول آمار و تحلیل
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    "eventType" VARCHAR(100) NOT NULL,
    "eventCategory" VARCHAR(50),
    "eventAction" VARCHAR(100),
    "eventLabel" VARCHAR(200),
    "userId" BIGINT,
    "sessionId" VARCHAR(100),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "deviceType" VARCHAR(30),
    browser VARCHAR(50),
    os VARCHAR(50),
    "screenResolution" VARCHAR(30),
    "pageUrl" VARCHAR(500),
    "pageTitle" VARCHAR(200),
    "referrerUrl" VARCHAR(500),
    metadata JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analytics_events_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_analytics_events_eventType ON analytics_events("eventType");
-- CREATE INDEX idx_analytics_events_eventCategory ON analytics_events("eventCategory");
-- CREATE INDEX idx_analytics_events_userId ON analytics_events("userId");
-- CREATE INDEX idx_analytics_events_createdAt ON analytics_events("createdAt");

-- ۷۷. جدول لاگ‌های سیستم
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    "userId" BIGINT,
    username VARCHAR(50),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    endpoint VARCHAR(500),
    method VARCHAR(10),
    "requestData" JSONB,
    "responseData" JSONB,
    "executionTime" INTEGER,
    "errorTrace" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_system_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_system_logs_level ON system_logs(level);
-- CREATE INDEX idx_system_logs_userId ON system_logs("userId");
-- CREATE INDEX idx_system_logs_createdAt ON system_logs("createdAt");

-- ۷۸. جدول تنظیمات سیستم
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    "settingKey" VARCHAR(100) UNIQUE NOT NULL,
    "settingValue" TEXT,
    "settingValueFa" TEXT,
    "settingType" VARCHAR(20) DEFAULT 'text',
    "groupName" VARCHAR(50),
    category VARCHAR(50),
    label VARCHAR(100),
    "labelFa" VARCHAR(100),
    description TEXT,
    "descriptionFa" TEXT,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isSystem" BOOLEAN DEFAULT FALSE,
    "isEncrypted" BOOLEAN DEFAULT FALSE,
    "validationRules" JSONB,
    options JSONB,
    "defaultValue" TEXT,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_settings_groupName ON settings("groupName");
-- CREATE INDEX idx_settings_category ON settings(category);
-- CREATE INDEX idx_settings_isPublic ON settings("isPublic");
CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۷۹. جدول API Keys
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "keyName" VARCHAR(100) NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(20),
    permissions JSONB,
    "rateLimit" INTEGER,
    "rateLimitPeriod" VARCHAR(20),
    "ipWhitelist" JSONB,
    "ipBlacklist" JSONB,
    "refererWhitelist" JSONB,
    "lastUsedAt" TIMESTAMP,
    "lastUsedIp" VARCHAR(45),
    "usageCount" BIGINT DEFAULT 0,
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE,
    "isRevoked" BOOLEAN DEFAULT FALSE,
    "revokedAt" TIMESTAMP,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_keys_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_api_keys_userId ON api_keys("userId");
-- CREATE INDEX idx_api_keys_keyHash ON api_keys("keyHash");
-- CREATE INDEX idx_api_keys_isActive ON api_keys("isActive");
CREATE TRIGGER trg_api_keys_updated_at
    BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۰. جدول وب‌هوک‌ها
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255),
    headers JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "retryCount" INTEGER DEFAULT 3,
    timeout INTEGER DEFAULT 30,
    "createdBy" BIGINT,
    "lastTriggeredAt" TIMESTAMP,
    "lastStatus" INTEGER,
    "lastResponse" TEXT,
    "totalTriggers" INTEGER DEFAULT 0,
    "successfulTriggers" INTEGER DEFAULT 0,
    "failedTriggers" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_webhooks_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_webhooks_isActive ON webhooks("isActive");
CREATE TRIGGER trg_webhooks_updated_at
    BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۱. جدول لاگ وب‌هوک
CREATE TABLE webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    "webhookId" INTEGER,
    "eventType" VARCHAR(100) NOT NULL,
    payload JSONB,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "triggeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_webhook_logs_webhook FOREIGN KEY ("webhookId") REFERENCES webhooks(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_webhook_logs_webhookId ON webhook_logs("webhookId");
-- CREATE INDEX idx_webhook_logs_eventType ON webhook_logs("eventType");
-- CREATE INDEX idx_webhook_logs_triggeredAt ON webhook_logs("triggeredAt");

-- ۸۲. جدول فایل‌ها و مستندات
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" BIGINT,
    "mimeType" VARCHAR(100),
    extension VARCHAR(20),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    thumbnail VARCHAR(500),
    checksum VARCHAR(64),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    tags JSONB,
    description TEXT,
    "uploadedBy" BIGINT,
    "ownerId" BIGINT,
    "ownerType" VARCHAR(50),
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" BIGINT,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "downloadCount" INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_uploaded_by FOREIGN KEY ("uploadedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_files_uploadedBy ON files("uploadedBy");
-- CREATE INDEX idx_files_ownerId ON files("ownerId");
-- CREATE INDEX idx_files_category ON files(category);
-- CREATE INDEX idx_files_relatedEntity ON files("relatedEntityType", "relatedEntityId");
CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۳. جدول بلاک‌های سفارشی
CREATE TABLE custom_blocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    content JSONB,
    "htmlContent" TEXT,
    "cssContent" TEXT,
    "jsContent" TEXT,
    settings JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "isSystem" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_custom_blocks_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_custom_blocks_slug ON custom_blocks(slug);
-- CREATE INDEX idx_custom_blocks_type ON custom_blocks(type);
-- CREATE INDEX idx_custom_blocks_isActive ON custom_blocks("isActive");
CREATE TRIGGER trg_custom_blocks_updated_at
    BEFORE UPDATE ON custom_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۴. جدول صفحات
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT,
    "contentFa" TEXT,
    excerpt TEXT,
    "excerptFa" TEXT,
    "featuredImage" VARCHAR(500),
    "metaTitle" VARCHAR(200),
    "metaTitleFa" VARCHAR(200),
    "metaDescription" VARCHAR(500),
    "metaDescriptionFa" VARCHAR(500),
    "metaKeywords" VARCHAR(300),
    "metaKeywordsFa" VARCHAR(300),
    "authorId" BIGINT,
    template VARCHAR(50),
    layout VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    password VARCHAR(100),
    "parentId" INTEGER,
    "orderIndex" INTEGER DEFAULT 0,
    "showInMenu" BOOLEAN DEFAULT TRUE,
    "showInFooter" BOOLEAN DEFAULT FALSE,
    "showInSitemap" BOOLEAN DEFAULT TRUE,
    "canonicalUrl" VARCHAR(500),
    "redirectUrl" VARCHAR(500),
    "viewCount" INTEGER DEFAULT 0,
    "publishedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pages_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_pages_parent FOREIGN KEY ("parentId") REFERENCES pages(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_pages_slug ON pages(slug);
-- CREATE INDEX idx_pages_status ON pages(status);
-- CREATE INDEX idx_pages_authorId ON pages("authorId");
CREATE TRIGGER trg_pages_updated_at
    BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۵. جدول منو
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    location VARCHAR(50) UNIQUE,
    description TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_menus_location ON menus(location);
CREATE TRIGGER trg_menus_updated_at
    BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۶. جدول آیتم‌های منو
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    "menuId" INTEGER,
    "parentId" INTEGER,
    title VARCHAR(100) NOT NULL,
    "titleFa" VARCHAR(100),
    url VARCHAR(500),
    target VARCHAR(20) DEFAULT '_self',
    icon VARCHAR(50),
    "cssClass" VARCHAR(100),
    "orderIndex" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_items_menu FOREIGN KEY ("menuId") REFERENCES menus(id) ON DELETE CASCADE,
    CONSTRAINT fk_menu_items_parent FOREIGN KEY ("parentId") REFERENCES menu_items(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_menu_items_menuId ON menu_items("menuId");
-- CREATE INDEX idx_menu_items_parentId ON menu_items("parentId");
-- CREATE INDEX idx_menu_items_orderIndex ON menu_items("orderIndex");

-- ۸۷. جدول قالب‌ها
CREATE TABLE themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20),
    author VARCHAR(100),
    "authorUrl" VARCHAR(500),
    description TEXT,
    "descriptionFa" TEXT,
    thumbnail VARCHAR(500),
    screenshot VARCHAR(500),
    "isActive" BOOLEAN DEFAULT FALSE,
    "isInstalled" BOOLEAN DEFAULT FALSE,
    "isSystem" BOOLEAN DEFAULT FALSE,
    "parentTheme" VARCHAR(100),
    settings JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_themes_slug ON themes(slug);
-- CREATE INDEX idx_themes_isActive ON themes("isActive");
CREATE TRIGGER trg_themes_updated_at
    BEFORE UPDATE ON themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۸. جدول افزونه‌ها
CREATE TABLE plugins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20),
    author VARCHAR(100),
    "authorUrl" VARCHAR(500),
    description TEXT,
    "descriptionFa" TEXT,
    "pluginUrl" VARCHAR(500),
    thumbnail VARCHAR(500),
    "isActive" BOOLEAN DEFAULT FALSE,
    "isInstalled" BOOLEAN DEFAULT FALSE,
    "isSystem" BOOLEAN DEFAULT FALSE,
    dependencies JSONB,
    settings JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_plugins_slug ON plugins(slug);
-- CREATE INDEX idx_plugins_isActive ON plugins("isActive");
CREATE TRIGGER trg_plugins_updated_at
    BEFORE UPDATE ON plugins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۸۹. جدول بک‌آپ
CREATE TABLE backups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" BIGINT,
    "compressionType" VARCHAR(20),
    "includesTables" JSONB,
    "excludesTables" JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "errorMessage" TEXT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_backups_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_backups_type ON backups(type);
-- CREATE INDEX idx_backups_status ON backups(status);
-- CREATE INDEX idx_backups_createdAt ON backups("createdAt");

-- ۹۰. جدول به‌روزرسانی‌ها (Migrations)
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    batch INTEGER NOT NULL,
    "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "rolledBackAt" TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    CONSTRAINT uk_migrations_version UNIQUE (version)
);
-- ═══════════════════════════════════════════════════════════════════════
--                    ۹۱. جدول صف پردازش
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT  NOT NULL,
    reservedAt TIMESTAMP,
    availableAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- INDEX idx_queue (queue)  -- TODO: Move outside CREATE TABLE,
    -- INDEX idx_reservedAt (reservedAt)  -- TODO: Move outside CREATE TABLE,
    -- INDEX idx_availableAt (availableAt)  -- TODO: Move outside CREATE TABLE
)  ;

-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۹۲ تا ۱۳۱)
-- ═══════════════════════════════════════════════════════════════════════

-- ۹۲. جدول صف ایمیل
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    "fromEmail" VARCHAR(100),
    "fromName" VARCHAR(100),
    "toEmail" VARCHAR(100) NOT NULL,
    "toName" VARCHAR(100),
    cc JSONB,
    bcc JSONB,
    subject VARCHAR(300) NOT NULL,
    body TEXT,
    "htmlBody" TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "sendAt" TIMESTAMP,
    "sentAt" TIMESTAMP,
    "failedAt" TIMESTAMP,
    "errorMessage" TEXT,
    attempts INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_email_queue_status ON email_queue(status);
-- CREATE INDEX idx_email_queue_toEmail ON email_queue("toEmail");
-- CREATE INDEX idx_email_queue_sendAt ON email_queue("sendAt");
CREATE TRIGGER trg_email_queue_updated_at
    BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۹۳. جدول تماس‌های اضطراری
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "contactName" VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    "isPrimary" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_emergency_contacts_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_emergency_contacts_userId ON emergency_contacts("userId");
-- CREATE INDEX idx_emergency_contacts_isPrimary ON emergency_contacts("isPrimary");
CREATE TRIGGER trg_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۹۴. جدول مهارت‌ها
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    "descriptionFa" TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_skills_category ON skills(category);
-- CREATE INDEX idx_skills_name ON skills(name);

-- ۹۵. جدول مهارت‌های کاربر
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "skillId" INTEGER,
    "proficiencyLevel" VARCHAR(20),
    "yearsOfExperience" INTEGER,
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_skills_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_skills_skill FOREIGN KEY ("skillId") REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_skills_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_skills_user_skill UNIQUE ("userId", "skillId")
);
-- CREATE INDEX idx_user_skills_userId ON user_skills("userId");
-- CREATE INDEX idx_user_skills_skillId ON user_skills("skillId");

-- ۹۶. جدول سوابق شغلی
CREATE TABLE work_experiences (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "companyName" VARCHAR(200) NOT NULL,
    "companyIndustry" VARCHAR(100),
    "position" VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isCurrent" BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT,
    "salaryRange" VARCHAR(50),
    "leaveReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_work_experiences_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_work_experiences_userId ON work_experiences("userId");
-- CREATE INDEX idx_work_experiences_isCurrent ON work_experiences("isCurrent");
CREATE TRIGGER trg_work_experiences_updated_at
    BEFORE UPDATE ON work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۹۷. جدول تحصیلات
CREATE TABLE educations (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    institution VARCHAR(200) NOT NULL,
    "fieldOfStudy" VARCHAR(200) NOT NULL,
    degree VARCHAR(50) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isCurrent" BOOLEAN DEFAULT FALSE,
    grade VARCHAR(20),
    description TEXT,
    "thesisTitle" VARCHAR(300),
    "thesisAbstract" TEXT,
    activities TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_educations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_educations_userId ON educations("userId");
-- CREATE INDEX idx_educations_degree ON educations(degree);
CREATE TRIGGER trg_educations_updated_at
    BEFORE UPDATE ON educations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۹۸. جدول گواهی‌ها و مدارک
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    issuer VARCHAR(200) NOT NULL,
    "issueDate" DATE,
    "expiryDate" DATE,
    "credentialId" VARCHAR(100),
    "credentialUrl" VARCHAR(500),
    "fileUrl" VARCHAR(500),
    type VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    skills JSONB,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificates_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificates_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_certificates_userId ON certificates("userId");
-- CREATE INDEX idx_certificates_type ON certificates(type);
-- CREATE INDEX idx_certificates_isVerified ON certificates("isVerified");
CREATE TRIGGER trg_certificates_updated_at
    BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۹۹. جدول پروژه‌ها
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    "startDate" DATE,
    "endDate" DATE,
    "dueDate" DATE,
    "actualEndDate" DATE,
    budget DECIMAL(15,2),
    progress INTEGER DEFAULT 0,
    "ownerId" BIGINT,
    "teamMembers" JSONB,
    tags JSONB,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isArchived" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_projects_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_projects_status ON projects(status);
-- CREATE INDEX idx_projects_priority ON projects(priority);
-- CREATE INDEX idx_projects_ownerId ON projects("ownerId");
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۰. جدول تسک‌ها
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    "projectId" INTEGER,
    "parentId" INTEGER,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    "assigneeId" BIGINT,
    "reporterId" BIGINT,
    "startDate" DATE,
    "dueDate" DATE,
    "completedAt" TIMESTAMP,
    "estimatedHours" DECIMAL(6,2),
    "actualHours" DECIMAL(6,2),
    progress INTEGER DEFAULT 0,
    tags JSONB,
    attachments JSONB,
    dependencies JSONB,
    "isMilestone" BOOLEAN DEFAULT FALSE,
    "isArchived" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_parent FOREIGN KEY ("parentId") REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY ("assigneeId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_reporter FOREIGN KEY ("reporterId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_tasks_projectId ON tasks("projectId");
-- CREATE INDEX idx_tasks_assigneeId ON tasks("assigneeId");
-- CREATE INDEX idx_tasks_status ON tasks(status);
-- CREATE INDEX idx_tasks_dueDate ON tasks("dueDate");
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۱. جدول کامنت تسک‌ها
CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    "taskId" INTEGER,
    "userId" BIGINT,
    content TEXT NOT NULL,
    attachments JSONB,
    "isEdited" BOOLEAN DEFAULT FALSE,
    "editedAt" TIMESTAMP,
    "editedBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_comments_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_comments_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_comments_edited_by FOREIGN KEY ("editedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_task_comments_taskId ON task_comments("taskId");
-- CREATE INDEX idx_task_comments_userId ON task_comments("userId");
CREATE TRIGGER trg_task_comments_updated_at
    BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۲. جدول لاگ تغییرات (Audit Logs) - قبلاً در بخش تکمیلی تعریف شده، اما در صورت نیاز به نسخه جدید:
-- توجه: جدول audit_logs قبلاً در بخش تکمیلی (جدول ۲۷) تعریف شده است.
-- در صورت تمایل به جایگزینی، تعریف زیر ارائه می‌شود.
/*
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" BIGINT,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" BIGINT,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_audit_logs_entityType ON audit_logs("entityType");
-- CREATE INDEX idx_audit_logs_entityId ON audit_logs("entityId");
-- CREATE INDEX idx_audit_logs_action ON audit_logs(action);
-- CREATE INDEX idx_audit_logs_userId ON audit_logs("userId");
-- CREATE INDEX idx_audit_logs_createdAt ON audit_logs("createdAt");
*/

-- ۱۰۳. جدول سطل آشغال
CREATE TABLE trash (
    id SERIAL PRIMARY KEY,
    "itemType" VARCHAR(50) NOT NULL,
    "itemId" BIGINT NOT NULL,
    "deletedData" JSONB NOT NULL,
    "deletedBy" BIGINT,
    "deleteReason" TEXT,
    "restoredAt" TIMESTAMP,
    "restoredBy" BIGINT,
    "permanentDeletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trash_deleted_by FOREIGN KEY ("deletedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_trash_restored_by FOREIGN KEY ("restoredBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_trash_itemType ON trash("itemType");
-- CREATE INDEX idx_trash_itemId ON trash("itemId");
-- CREATE INDEX idx_trash_createdAt ON trash("createdAt");

-- ۱۰۴. جدول سطوح دسترسی داده
CREATE TABLE data_permissions (
    id SERIAL PRIMARY KEY,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" BIGINT NOT NULL,
    "userId" BIGINT,
    "roleId" INTEGER,
    permission VARCHAR(50) NOT NULL,
    "grantedBy" BIGINT,
    "grantedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    conditions JSONB,
    CONSTRAINT fk_data_permissions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_permissions_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_permissions_granted_by FOREIGN KEY ("grantedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_data_permissions_entity_permission UNIQUE ("entityType", "entityId", "userId", "roleId", permission)
);
-- CREATE INDEX idx_data_permissions_entity ON data_permissions("entityType", "entityId");
-- CREATE INDEX idx_data_permissions_userId ON data_permissions("userId");
-- CREATE INDEX idx_data_permissions_roleId ON data_permissions("roleId");

-- ۱۰۵. جدول فیلدهای سفارشی
CREATE TABLE custom_fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    slug VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "fieldType" VARCHAR(30) NOT NULL,
    "fieldOptions" JSONB,
    "defaultValue" TEXT,
    "validationRules" JSONB,
    "isRequired" BOOLEAN DEFAULT FALSE,
    "isUnique" BOOLEAN DEFAULT FALSE,
    "isSearchable" BOOLEAN DEFAULT FALSE,
    "isFilterable" BOOLEAN DEFAULT FALSE,
    "showInList" BOOLEAN DEFAULT FALSE,
    "showInForm" BOOLEAN DEFAULT TRUE,
    "showInDetail" BOOLEAN DEFAULT TRUE,
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_custom_fields_entityType ON custom_fields("entityType");
-- CREATE INDEX idx_custom_fields_slug ON custom_fields(slug);
-- CREATE INDEX idx_custom_fields_isActive ON custom_fields("isActive");
CREATE TRIGGER trg_custom_fields_updated_at
    BEFORE UPDATE ON custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۶. جدول مقادیر فیلدهای سفارشی
CREATE TABLE custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    "fieldId" INTEGER,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" BIGINT NOT NULL,
    value TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_custom_field_values_field FOREIGN KEY ("fieldId") REFERENCES custom_fields(id) ON DELETE CASCADE,
    CONSTRAINT uk_custom_field_values_field_entity UNIQUE ("fieldId", "entityType", "entityId")
);
-- CREATE INDEX idx_custom_field_values_entity ON custom_field_values("entityType", "entityId");
-- CREATE INDEX idx_custom_field_values_fieldId ON custom_field_values("fieldId");
CREATE TRIGGER trg_custom_field_values_updated_at
    BEFORE UPDATE ON custom_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۷. جدول گزارش‌های آماده
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    description TEXT,
    "descriptionFa" TEXT,
    category VARCHAR(50),
    "reportType" VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    parameters JSONB,
    columns JSONB,
    filters JSONB,
    "groupBy" JSONB,
    "orderBy" JSONB,
    "chartConfig" JSONB,
    "exportFormats" JSONB,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isFavorite" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_templates_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_report_templates_category ON report_templates(category);
-- CREATE INDEX idx_report_templates_reportType ON report_templates("reportType");
-- CREATE INDEX idx_report_templates_createdBy ON report_templates("createdBy");
CREATE TRIGGER trg_report_templates_updated_at
    BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۸. جدول داشبوردها
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    description TEXT,
    layout JSONB,
    widgets JSONB,
    "isDefault" BOOLEAN DEFAULT FALSE,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dashboards_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_dashboards_createdBy ON dashboards("createdBy");
-- CREATE INDEX idx_dashboards_isDefault ON dashboards("isDefault");
CREATE TRIGGER trg_dashboards_updated_at
    BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۰۹. جدول ویجت‌ها
CREATE TABLE widgets (
    id SERIAL PRIMARY KEY,
    "dashboardId" INTEGER,
    "widgetType" VARCHAR(50) NOT NULL,
    title VARCHAR(100),
    "titleFa" VARCHAR(100),
    config JSONB,
    "position" JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_widgets_dashboard FOREIGN KEY ("dashboardId") REFERENCES dashboards(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_widgets_dashboardId ON widgets("dashboardId");
CREATE TRIGGER trg_widgets_updated_at
    BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۱۰. جدول bookmarks (وابسته به جدول ۱۱۱ که باید اول ایجاد شود)
-- ابتدا جدول ۱۱۱ را ایجاد می‌کنیم
CREATE TABLE bookmark_folders (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "parentId" INTEGER,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookmark_folders_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmark_folders_parent FOREIGN KEY ("parentId") REFERENCES bookmark_folders(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_bookmark_folders_userId ON bookmark_folders("userId");
-- CREATE INDEX idx_bookmark_folders_parentId ON bookmark_folders("parentId");
CREATE TRIGGER trg_bookmark_folders_updated_at
    BEFORE UPDATE ON bookmark_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- حالا جدول bookmarks
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    favicon VARCHAR(500),
    thumbnail VARCHAR(500),
    tags JSONB,
    "folderId" INTEGER,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "clickCount" INTEGER DEFAULT 0,
    "lastAccessedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookmarks_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_folder FOREIGN KEY ("folderId") REFERENCES bookmark_folders(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_bookmarks_userId ON bookmarks("userId");
-- CREATE INDEX idx_bookmarks_folderId ON bookmarks("folderId");
CREATE TRIGGER trg_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۱۲. جدول لاگ فعالیت کاربر
CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT,
    action VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50),
    "entityId" BIGINT,
    description TEXT,
    metadata JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "sessionId" VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_activity_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_user_activity_logs_userId ON user_activity_logs("userId");
-- CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
-- CREATE INDEX idx_user_activity_logs_entity ON user_activity_logs("entityType", "entityId");
-- CREATE INDEX idx_user_activity_logs_createdAt ON user_activity_logs("createdAt");

-- ۱۱۳. جدول سطوح کاربر
CREATE TABLE user_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    "nameFa" VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "maxPoints" INTEGER,
    color VARCHAR(20),
    icon VARCHAR(50),
    badge VARCHAR(500),
    privileges JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_levels_level UNIQUE (level)
);
-- CREATE INDEX idx_user_levels_minPoints ON user_levels("minPoints");

-- ۱۱۴. جدول امتیازات کاربر
CREATE TABLE user_points (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT,
    points INTEGER NOT NULL,
    reason VARCHAR(200),
    type VARCHAR(50),
    "referenceType" VARCHAR(50),
    "referenceId" BIGINT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_points_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_points_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_user_points_userId ON user_points("userId");
-- CREATE INDEX idx_user_points_type ON user_points(type);
-- CREATE INDEX idx_user_points_createdAt ON user_points("createdAt");

-- ۱۱۵. جدول دستاوردها
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    description TEXT,
    "descriptionFa" TEXT,
    icon VARCHAR(50),
    image VARCHAR(500),
    category VARCHAR(50),
    points INTEGER DEFAULT 0,
    criteria JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_achievements_category ON achievements(category);
-- CREATE INDEX idx_achievements_isActive ON achievements("isActive");

-- ۱۱۶. جدول دستاوردهای کاربر
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "achievementId" INTEGER,
    "earnedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "notificationSent" BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user_achievements_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY ("achievementId") REFERENCES achievements(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_achievements_user_achievement UNIQUE ("userId", "achievementId")
);
-- CREATE INDEX idx_user_achievements_userId ON user_achievements("userId");
-- CREATE INDEX idx_user_achievements_achievementId ON user_achievements("achievementId");

-- ۱۱۷. جدول یادآورها
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "remindableType" VARCHAR(50),
    "remindableId" BIGINT,
    "remindAt" TIMESTAMP NOT NULL,
    "repeatType" VARCHAR(20),
    "repeatInterval" INTEGER,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP,
    "isRecurring" BOOLEAN DEFAULT FALSE,
    "nextRemindAt" TIMESTAMP,
    "notifyByEmail" BOOLEAN DEFAULT TRUE,
    "notifyBySms" BOOLEAN DEFAULT FALSE,
    "notifyByPush" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminders_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_reminders_userId ON reminders("userId");
-- CREATE INDEX idx_reminders_remindAt ON reminders("remindAt");
-- CREATE INDEX idx_reminders_isCompleted ON reminders("isCompleted");
CREATE TRIGGER trg_reminders_updated_at
    BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۱۸. جدول ارجاعات
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    "referrerId" BIGINT,
    "refereeId" BIGINT,
    "referralCode" VARCHAR(50) UNIQUE NOT NULL,
    "referralType" VARCHAR(50),
    "rewardPoints" INTEGER DEFAULT 0,
    "rewardAmount" DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    "convertedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_referrals_referrer FOREIGN KEY ("referrerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_referrals_referee FOREIGN KEY ("refereeId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_referrals_referee UNIQUE ("refereeId")
);
-- CREATE INDEX idx_referrals_referrerId ON referrals("referrerId");
-- CREATE INDEX idx_referrals_status ON referrals(status);

-- ۱۱۹. جدول سوشال مدیا
CREATE TABLE social_posts (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    content TEXT NOT NULL,
    media JSONB,
    hashtags JSONB,
    mentions JSONB,
    location VARCHAR(200),
    privacy VARCHAR(20) DEFAULT 'public',
    status VARCHAR(20) DEFAULT 'published',
    "likesCount" INTEGER DEFAULT 0,
    "commentsCount" INTEGER DEFAULT 0,
    "sharesCount" INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "isPinned" BOOLEAN DEFAULT FALSE,
    "isEdited" BOOLEAN DEFAULT FALSE,
    "editedAt" TIMESTAMP,
    "publishedAt" TIMESTAMP,
    "scheduledAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_posts_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_social_posts_userId ON social_posts("userId");
-- CREATE INDEX idx_social_posts_status ON social_posts(status);
-- CREATE INDEX idx_social_posts_privacy ON social_posts(privacy);
-- CREATE INDEX idx_social_posts_publishedAt ON social_posts("publishedAt");
CREATE TRIGGER trg_social_posts_updated_at
    BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۰. جدول لایک پست‌ها
CREATE TABLE social_likes (
    id SERIAL PRIMARY KEY,
    "postId" INTEGER,
    "userId" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_likes_post FOREIGN KEY ("postId") REFERENCES social_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_likes_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_social_likes_post_user UNIQUE ("postId", "userId")
);
-- CREATE INDEX idx_social_likes_postId ON social_likes("postId");
-- CREATE INDEX idx_social_likes_userId ON social_likes("userId");

-- ۱۲۱. جدول کامنت پست‌ها
CREATE TABLE social_comments (
    id SERIAL PRIMARY KEY,
    "postId" INTEGER,
    "parentId" INTEGER,
    "userId" BIGINT,
    content TEXT NOT NULL,
    media JSONB,
    "likesCount" INTEGER DEFAULT 0,
    "isEdited" BOOLEAN DEFAULT FALSE,
    "editedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_comments_post FOREIGN KEY ("postId") REFERENCES social_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_comments_parent FOREIGN KEY ("parentId") REFERENCES social_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_comments_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_social_comments_postId ON social_comments("postId");
-- CREATE INDEX idx_social_comments_parentId ON social_comments("parentId");
-- CREATE INDEX idx_social_comments_userId ON social_comments("userId");
CREATE TRIGGER trg_social_comments_updated_at
    BEFORE UPDATE ON social_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۲. جدول دنبال‌کنندگان
CREATE TABLE social_follows (
    id SERIAL PRIMARY KEY,
    "followerId" BIGINT,
    "followingId" BIGINT,
    status VARCHAR(20) DEFAULT 'accepted',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_follows_follower FOREIGN KEY ("followerId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_follows_following FOREIGN KEY ("followingId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_social_follows_follower_following UNIQUE ("followerId", "followingId")
);
-- CREATE INDEX idx_social_follows_followerId ON social_follows("followerId");
-- CREATE INDEX idx_social_follows_followingId ON social_follows("followingId");

-- ۱۲۳. جدول پیامک‌ها
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    "senderNumber" VARCHAR(20),
    provider VARCHAR(50),
    "providerMessageId" VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    "sentAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "failedAt" TIMESTAMP,
    "errorMessage" TEXT,
    attempts INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    cost DECIMAL(10,2),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_sms_logs_phone ON sms_logs(phone);
-- CREATE INDEX idx_sms_logs_status ON sms_logs(status);
-- CREATE INDEX idx_sms_logs_createdAt ON sms_logs("createdAt");
CREATE TRIGGER trg_sms_logs_updated_at
    BEFORE UPDATE ON sms_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۴. جدول قالب‌های پیامک
CREATE TABLE sms_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    code VARCHAR(50) UNIQUE NOT NULL,
    body TEXT NOT NULL,
    "bodyFa" TEXT,
    variables JSONB,
    category VARCHAR(50),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_sms_templates_code ON sms_templates(code);
-- CREATE INDEX idx_sms_templates_category ON sms_templates(category);
-- CREATE INDEX idx_sms_templates_isActive ON sms_templates("isActive");
CREATE TRIGGER trg_sms_templates_updated_at
    BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۵. جدول اعتبارسنجی
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    type VARCHAR(50) NOT NULL,
    identifier VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "verifiedAt" TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    attempts INTEGER DEFAULT 0,
    "isUsed" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verifications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_verifications_type ON verifications(type);
-- CREATE INDEX idx_verifications_identifier ON verifications(identifier);
-- CREATE INDEX idx_verifications_expiresAt ON verifications("expiresAt");

-- ۱۲۶. جدول لاگین اجتماعی
CREATE TABLE social_logins (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    provider VARCHAR(50) NOT NULL,
    "providerId" VARCHAR(100),
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP,
    "tokenType" VARCHAR(20),
    scope VARCHAR(200),
    "avatarUrl" VARCHAR(500),
    "profileData" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_logins_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_social_logins_provider_user UNIQUE (provider, "userId")
);
-- CREATE INDEX idx_social_logins_provider ON social_logins(provider);
-- CREATE INDEX idx_social_logins_providerId ON social_logins("providerId");
CREATE TRIGGER trg_social_logins_updated_at
    BEFORE UPDATE ON social_logins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۷. جدول سرویس‌های خارجی
CREATE TABLE external_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    "descriptionFa" TEXT,
    "apiUrl" VARCHAR(500),
    "webhookUrl" VARCHAR(500),
    credentials JSONB,
    settings JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "isConnected" BOOLEAN DEFAULT FALSE,
    "lastSyncAt" TIMESTAMP,
    "syncStatus" VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_external_services_slug ON external_services(slug);
-- CREATE INDEX idx_external_services_type ON external_services(type);
-- CREATE INDEX idx_external_services_isActive ON external_services("isActive");
CREATE TRIGGER trg_external_services_updated_at
    BEFORE UPDATE ON external_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۲۸. جدول لاگ سرویس‌های خارجی
CREATE TABLE external_service_logs (
    id BIGSERIAL PRIMARY KEY,
    "serviceId" INTEGER,
    action VARCHAR(100) NOT NULL,
    "requestData" JSONB,
    "responseData" JSONB,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "executionTime" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_external_service_logs_service FOREIGN KEY ("serviceId") REFERENCES external_services(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_external_service_logs_serviceId ON external_service_logs("serviceId");
-- CREATE INDEX idx_external_service_logs_action ON external_service_logs(action);
-- CREATE INDEX idx_external_service_logs_createdAt ON external_service_logs("createdAt");

-- ۱۲۹. جدول ساختار سازمانی
CREATE TABLE organizational_structure (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL,
    "parentId" INTEGER,
    "managerId" BIGINT,
    "assistantManagerId" BIGINT,
    level INTEGER DEFAULT 1,
    "orderIndex" INTEGER DEFAULT 0,
    "establishmentDate" VARCHAR(20),
    description TEXT,
    "descriptionFa" TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizational_structure_parent FOREIGN KEY ("parentId") REFERENCES organizational_structure(id) ON DELETE SET NULL,
    CONSTRAINT fk_organizational_structure_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_organizational_structure_assistant_manager FOREIGN KEY ("assistantManagerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_organizational_structure_type ON organizational_structure(type);
-- CREATE INDEX idx_organizational_structure_parentId ON organizational_structure("parentId");
-- CREATE INDEX idx_organizational_structure_level ON organizational_structure(level);
CREATE TRIGGER trg_organizational_structure_updated_at
    BEFORE UPDATE ON organizational_structure FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۰. جدول پست‌های سازمانی
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    code VARCHAR(50) UNIQUE,
    "organizationId" INTEGER,
    "departmentId" INTEGER,
    description TEXT,
    "descriptionFa" TEXT,
    responsibilities TEXT,
    requirements TEXT,
    qualifications TEXT,
    "employmentType" VARCHAR(50),
    level VARCHAR(50),
    "minSalary" DECIMAL(15,2),
    "maxSalary" DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'IRR',
    location VARCHAR(200),
    "isRemote" BOOLEAN DEFAULT FALSE,
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "educationLevel" VARCHAR(50),
    skills JSONB,
    status VARCHAR(20) DEFAULT 'open',
    "publishDate" DATE,
    "expireDate" DATE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_positions_organization FOREIGN KEY ("organizationId") REFERENCES organizational_structure(id) ON DELETE SET NULL,
    CONSTRAINT fk_job_positions_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_job_positions_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_job_positions_organizationId ON job_positions("organizationId");
-- CREATE INDEX idx_job_positions_status ON job_positions(status);
-- CREATE INDEX idx_job_positions_isActive ON job_positions("isActive");
CREATE TRIGGER trg_job_positions_updated_at
    BEFORE UPDATE ON job_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۱. جدول درخواست‌های استخدام
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    "jobId" INTEGER,
    "userId" BIGINT,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    "resumeUrl" VARCHAR(500),
    "coverLetter" TEXT,
    "portfolioUrl" VARCHAR(500),
    "linkedinUrl" VARCHAR(200),
    "expectedSalary" DECIMAL(15,2),
    "noticePeriod" VARCHAR(50),
    status VARCHAR(20) DEFAULT 'applied',
    "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "interviewDate" TIMESTAMP,
    "interviewResult" VARCHAR(20),
    "rejectionReason" TEXT,
    notes TEXT,
    CONSTRAINT fk_job_applications_job FOREIGN KEY ("jobId") REFERENCES job_positions(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_applications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_job_applications_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_job_applications_job_user UNIQUE ("jobId", "userId")
);
-- CREATE INDEX idx_job_applications_jobId ON job_applications("jobId");
-- CREATE INDEX idx_job_applications_status ON job_applications(status);
-- CREATE INDEX idx_job_applications_appliedAt ON job_applications("appliedAt");
-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۱۳۲ تا ۱۶۲)
-- ═══════════════════════════════════════════════════════════════════════

-- ۱۳۲. جدول جلسات مصاحبه
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    "applicationId" INTEGER,
    "interviewerId" BIGINT,
    "interviewType" VARCHAR(50),
    "scheduledAt" TIMESTAMP NOT NULL,
    duration INTEGER,
    location VARCHAR(200),
    "onlineLink" VARCHAR(500),
    "isOnline" BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'scheduled',
    result VARCHAR(20),
    score INTEGER,
    feedback TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_application FOREIGN KEY ("applicationId") REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_interviewer FOREIGN KEY ("interviewerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_interviews_applicationId ON interviews("applicationId");
-- CREATE INDEX idx_interviews_interviewerId ON interviews("interviewerId");
-- CREATE INDEX idx_interviews_scheduledAt ON interviews("scheduledAt");
-- CREATE INDEX idx_interviews_status ON interviews(status);
CREATE TRIGGER trg_interviews_updated_at
    BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۳. جدول دوره‌های آموزشی داخلی
CREATE TABLE training_programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    code VARCHAR(50) UNIQUE,
    description TEXT,
    "descriptionFa" TEXT,
    objectives TEXT,
    syllabus TEXT,
    "instructorId" BIGINT,
    "organizationId" INTEGER,
    category VARCHAR(50),
    level VARCHAR(20),
    "durationHours" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "registrationStart" DATE,
    "registrationEnd" DATE,
    capacity INTEGER,
    "enrolledCount" INTEGER DEFAULT 0,
    location VARCHAR(200),
    "isOnline" BOOLEAN DEFAULT FALSE,
    "onlinePlatform" VARCHAR(100),
    "certificateEnabled" BOOLEAN DEFAULT TRUE,
    "certificateTemplate" VARCHAR(500),
    cost DECIMAL(12,2) DEFAULT 0,
    "isFree" BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'draft',
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_programs_instructor FOREIGN KEY ("instructorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_training_programs_organization FOREIGN KEY ("organizationId") REFERENCES organizational_structure(id) ON DELETE SET NULL,
    CONSTRAINT fk_training_programs_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_training_programs_category ON training_programs(category);
-- CREATE INDEX idx_training_programs_status ON training_programs(status);
-- CREATE INDEX idx_training_programs_startDate ON training_programs("startDate");
CREATE TRIGGER trg_training_programs_updated_at
    BEFORE UPDATE ON training_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۴. جدول ثبت‌نام دوره‌های آموزشی
CREATE TABLE training_registrations (
    id SERIAL PRIMARY KEY,
    "programId" INTEGER,
    "userId" BIGINT,
    "registrationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    "attendanceCount" INTEGER DEFAULT 0,
    "completionPercentage" DECIMAL(5,2) DEFAULT 0,
    "finalScore" DECIMAL(5,2),
    "finalResult" VARCHAR(20),
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    "certificateDate" TIMESTAMP,
    feedback TEXT,
    rating INTEGER,
    CONSTRAINT fk_training_registrations_program FOREIGN KEY ("programId") REFERENCES training_programs(id) ON DELETE CASCADE,
    CONSTRAINT fk_training_registrations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_training_registrations_program_user UNIQUE ("programId", "userId")
);
-- CREATE INDEX idx_training_registrations_programId ON training_registrations("programId");
-- CREATE INDEX idx_training_registrations_userId ON training_registrations("userId");
-- CREATE INDEX idx_training_registrations_status ON training_registrations(status);

-- ۱۳۵. جدول ارزیابی عملکرد
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    "employeeId" BIGINT,
    "reviewerId" BIGINT,
    "reviewPeriod" VARCHAR(50),
    "reviewType" VARCHAR(50),
    "reviewDate" DATE NOT NULL,
    goals JSONB,
    achievements TEXT,
    strengths TEXT,
    weaknesses TEXT,
    "overallRating" DECIMAL(3,2),
    "ratingBreakdown" JSONB,
    comments TEXT,
    "employeeComments" TEXT,
    recommendations TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    "submittedAt" TIMESTAMP,
    "acknowledgedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_performance_reviews_employee FOREIGN KEY ("employeeId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_performance_reviews_reviewer FOREIGN KEY ("reviewerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_performance_reviews_employeeId ON performance_reviews("employeeId");
-- CREATE INDEX idx_performance_reviews_reviewerId ON performance_reviews("reviewerId");
-- CREATE INDEX idx_performance_reviews_reviewDate ON performance_reviews("reviewDate");
-- CREATE INDEX idx_performance_reviews_status ON performance_reviews(status);
CREATE TRIGGER trg_performance_reviews_updated_at
    BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۶. جدول مرخصی
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "leaveType" VARCHAR(50) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "halfDay" BOOLEAN DEFAULT FALSE,
    reason TEXT,
    "replacementUserId" BIGINT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leaves_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leaves_replacement_user FOREIGN KEY ("replacementUserId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_leaves_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_leaves_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_leaves_userId ON leaves("userId");
-- CREATE INDEX idx_leaves_leaveType ON leaves("leaveType");
-- CREATE INDEX idx_leaves_status ON leaves(status);
-- CREATE INDEX idx_leaves_startDate ON leaves("startDate");
CREATE TRIGGER trg_leaves_updated_at
    BEFORE UPDATE ON leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۷. جدول مانده مرخصی
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "leaveType" VARCHAR(50) NOT NULL,
    "academicTermId" INTEGER,
    "totalDays" INTEGER NOT NULL,
    "usedDays" INTEGER DEFAULT 0,
    "remainingDays" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_balances_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_balances_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT uk_leave_balances_user_type_term UNIQUE ("userId", "leaveType", "academicTermId")
);
-- CREATE INDEX idx_leave_balances_userId ON leave_balances("userId");
-- CREATE INDEX idx_leave_balances_leaveType ON leave_balances("leaveType");
CREATE TRIGGER trg_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۸. جدول مأموریت
CREATE TABLE missions (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "missionType" VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    destination VARCHAR(200),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "transportationType" VARCHAR(50),
    "accommodationRequired" BOOLEAN DEFAULT FALSE,
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    report TEXT,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_missions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_missions_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_missions_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_missions_userId ON missions("userId");
-- CREATE INDEX idx_missions_status ON missions(status);
-- CREATE INDEX idx_missions_startDate ON missions("startDate");
CREATE TRIGGER trg_missions_updated_at
    BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۳۹. جدول اضافه‌کاری
CREATE TABLE overtime (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    date DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "totalHours" DECIMAL(5,2) NOT NULL,
    reason TEXT,
    "taskDescription" TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    payment DECIMAL(10,2),
    "isPaid" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_overtime_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_overtime_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_overtime_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_overtime_userId ON overtime("userId");
-- CREATE INDEX idx_overtime_date ON overtime(date);
-- CREATE INDEX idx_overtime_status ON overtime(status);
CREATE TRIGGER trg_overtime_updated_at
    BEFORE UPDATE ON overtime FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۰. جدول حضور و غیاب کارکنان
CREATE TABLE staff_attendance (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    date DATE NOT NULL,
    "checkIn" TIME,
    "checkOut" TIME,
    "workHours" DECIMAL(5,2),
    "lateMinutes" INTEGER DEFAULT 0,
    "earlyLeaveMinutes" INTEGER DEFAULT 0,
    "overtimeHours" DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present',
    remarks TEXT,
    "recordedBy" BIGINT,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_attendance_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_attendance_recorded_by FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_staff_attendance_user_date UNIQUE ("userId", date)
);
-- CREATE INDEX idx_staff_attendance_userId ON staff_attendance("userId");
-- CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);
-- CREATE INDEX idx_staff_attendance_status ON staff_attendance(status);

-- ۱۴۱. جدول شیفت‌های کاری
CREATE TABLE work_shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "breakStart" TIME,
    "breakEnd" TIME,
    "workHours" DECIMAL(5,2),
    color VARCHAR(20),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_work_shifts_isActive ON work_shifts("isActive");
CREATE TRIGGER trg_work_shifts_updated_at
    BEFORE UPDATE ON work_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۲. جدول تخصیص شیفت
CREATE TABLE shift_assignments (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "shiftId" INTEGER,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shift_assignments_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_shift FOREIGN KEY ("shiftId") REFERENCES work_shifts(id) ON DELETE CASCADE,
    CONSTRAINT uk_shift_assignments_user_date UNIQUE ("userId", "startDate")
);
-- CREATE INDEX idx_shift_assignments_userId ON shift_assignments("userId");
-- CREATE INDEX idx_shift_assignments_shiftId ON shift_assignments("shiftId");
CREATE TRIGGER trg_shift_assignments_updated_at
    BEFORE UPDATE ON shift_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۳. جدول پرداخت حقوق
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "academicTermId" INTEGER,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    bonuses JSONB,
    "overtimePay" DECIMAL(12,2) DEFAULT 0,
    "grossSalary" DECIMAL(15,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    insurance DECIMAL(12,2) DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "paymentDate" DATE,
    "paymentMethod" VARCHAR(30),
    "transactionId" VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payroll_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_payroll_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_payroll_userId ON payroll("userId");
-- CREATE INDEX idx_payroll_academicTermId ON payroll("academicTermId");
-- CREATE INDEX idx_payroll_status ON payroll(status);
-- CREATE INDEX idx_payroll_paymentDate ON payroll("paymentDate");
CREATE TRIGGER trg_payroll_updated_at
    BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۴. جدول قراردادها
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "contractType" VARCHAR(50) NOT NULL,
    "contractNumber" VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "durationMonths" INTEGER,
    value DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'IRR',
    "paymentTerms" TEXT,
    "termsAndConditions" TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    "signedBy" BIGINT,
    "signedAt" TIMESTAMP,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contracts_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_contracts_signed_by FOREIGN KEY ("signedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_contracts_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_contracts_userId ON contracts("userId");
-- CREATE INDEX idx_contracts_contractType ON contracts("contractType");
-- CREATE INDEX idx_contracts_status ON contracts(status);
-- CREATE INDEX idx_contracts_startDate ON contracts("startDate");
CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۵. جدول مجوزهای صادره
CREATE TABLE permits (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "permitType" VARCHAR(50) NOT NULL,
    "permitNumber" VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    "issueDate" DATE NOT NULL,
    "expiryDate" DATE,
    "issuingAuthority" VARCHAR(200),
    "documentUrl" VARCHAR(500),
    status VARCHAR(20) DEFAULT 'valid',
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_permits_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_permits_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_permits_userId ON permits("userId");
-- CREATE INDEX idx_permits_permitType ON permits("permitType");
-- CREATE INDEX idx_permits_status ON permits(status);
-- CREATE INDEX idx_permits_expiryDate ON permits("expiryDate");
CREATE TRIGGER trg_permits_updated_at
    BEFORE UPDATE ON permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۶. جدول اموال و دارایی‌ها
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    "assetCode" VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    description TEXT,
    "serialNumber" VARCHAR(100),
    barcode VARCHAR(100),
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(15,2),
    "currentValue" DECIMAL(15,2),
    "depreciationRate" DECIMAL(5,2),
    "usefulLifeYears" INTEGER,
    location VARCHAR(200),
    "assignedTo" BIGINT,
    "assignedAt" TIMESTAMP,
    condition VARCHAR(30),
    status VARCHAR(20) DEFAULT 'available',
    "warrantyExpiry" DATE,
    "maintenanceDue" DATE,
    image VARCHAR(500),
    images JSONB,
    specifications JSONB,
    notes TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assets_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_assets_category ON assets(category);
-- CREATE INDEX idx_assets_assignedTo ON assets("assignedTo");
-- CREATE INDEX idx_assets_status ON assets(status);
-- CREATE INDEX idx_assets_isActive ON assets("isActive");
CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۷. جدول تعمیرات و نگهداری
CREATE TABLE maintenance (
    id SERIAL PRIMARY KEY,
    "assetId" INTEGER,
    "maintenanceType" VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    "reportedBy" BIGINT,
    "assignedTo" BIGINT,
    "scheduledDate" DATE,
    "completedDate" DATE,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    cost DECIMAL(12,2),
    parts JSONB,
    "laborHours" DECIMAL(5,2),
    result TEXT,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_asset FOREIGN KEY ("assetId") REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_reported_by FOREIGN KEY ("reportedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_maintenance_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_maintenance_assetId ON maintenance("assetId");
-- CREATE INDEX idx_maintenance_status ON maintenance(status);
-- CREATE INDEX idx_maintenance_priority ON maintenance(priority);
CREATE TRIGGER trg_maintenance_updated_at
    BEFORE UPDATE ON maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۸. جدول باشگاه校友 (Alumni)
CREATE TABLE alumni (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT UNIQUE,
    "studentId" INTEGER,
    "graduationYear" INTEGER,
    "graduationTerm" INTEGER,
    degree VARCHAR(50),
    "fieldOfStudy" VARCHAR(100),
    "currentCompany" VARCHAR(200),
    "currentPosition" VARCHAR(200),
    "currentCity" VARCHAR(100),
    "currentCountry" VARCHAR(100),
    "employmentStatus" VARCHAR(50),
    "companyName" VARCHAR(200),
    "jobTitle" VARCHAR(200),
    "jobIndustry" VARCHAR(100),
    "jobLevel" VARCHAR(50),
    "salaryRange" VARCHAR(50),
    "linkedinUrl" VARCHAR(200),
    "websiteUrl" VARCHAR(200),
    "isWillingToMentor" BOOLEAN DEFAULT FALSE,
    "isWillingToVolunteer" BOOLEAN DEFAULT FALSE,
    interests TEXT,
    skills JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alumni_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_alumni_student FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_alumni_graduationYear ON alumni("graduationYear");
-- CREATE INDEX idx_alumni_employmentStatus ON alumni("employmentStatus");
-- CREATE INDEX idx_alumni_isWillingToMentor ON alumni("isWillingToMentor");
CREATE TRIGGER trg_alumni_updated_at
    BEFORE UPDATE ON alumni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۴۹. جدول رویدادهای校友 (Alumni Events)
CREATE TABLE alumni_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    type VARCHAR(50),
    "eventDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    location VARCHAR(200),
    "onlineLink" VARCHAR(500),
    "isOnline" BOOLEAN DEFAULT FALSE,
    "organizerId" BIGINT,
    capacity INTEGER,
    "registeredCount" INTEGER DEFAULT 0,
    image VARCHAR(500),
    attachments JSONB,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isCancelled" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alumni_events_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_alumni_events_type ON alumni_events(type);
-- CREATE INDEX idx_alumni_events_eventDate ON alumni_events("eventDate");
-- CREATE INDEX idx_alumni_events_isPublished ON alumni_events("isPublished");
CREATE TRIGGER trg_alumni_events_updated_at
    BEFORE UPDATE ON alumni_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۰. جدول ثبت‌نام رویدادهای校友 (Alumni Event Registrations)
CREATE TABLE alumni_event_registrations (
    id SERIAL PRIMARY KEY,
    "eventId" INTEGER,
    "userId" BIGINT,
    "registrationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    "attendanceStatus" VARCHAR(20) DEFAULT 'pending',
    feedback TEXT,
    rating INTEGER,
    CONSTRAINT fk_alumni_event_registrations_event FOREIGN KEY ("eventId") REFERENCES alumni_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_alumni_event_registrations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_alumni_event_registrations_event_user UNIQUE ("eventId", "userId")
);
-- CREATE INDEX idx_alumni_event_registrations_eventId ON alumni_event_registrations("eventId");
-- CREATE INDEX idx_alumni_event_registrations_userId ON alumni_event_registrations("userId");

-- ۱۵۱. جدول کمک‌های مالی (Scholarships)
CREATE TABLE scholarships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    code VARCHAR(50) UNIQUE,
    description TEXT,
    "descriptionFa" TEXT,
    "donorName" VARCHAR(200),
    "donorType" VARCHAR(50),
    amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'IRR',
    quantity INTEGER,
    "awardedCount" INTEGER DEFAULT 0,
    "eligibilityCriteria" TEXT,
    "requiredDocuments" JSONB,
    "applicationStartDate" DATE,
    "applicationEndDate" DATE,
    "awardDate" DATE,
    "academicTermId" INTEGER,
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "studyLevel" VARCHAR(50),
    "gpaRequirement" DECIMAL(4,2),
    "financialNeed" BOOLEAN DEFAULT FALSE,
    "isRenewable" BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft',
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scholarships_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_scholarships_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_scholarships_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_scholarships_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_scholarships_status ON scholarships(status);
-- CREATE INDEX idx_scholarships_academicTermId ON scholarships("academicTermId");
-- CREATE INDEX idx_scholarships_applicationEndDate ON scholarships("applicationEndDate");
CREATE TRIGGER trg_scholarships_updated_at
    BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۲. جدول درخواست کمک‌های مالی
CREATE TABLE scholarship_applications (
    id SERIAL PRIMARY KEY,
    "scholarshipId" INTEGER,
    "userId" BIGINT,
    "applicationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    gpa DECIMAL(4,2),
    "financialNeedLevel" VARCHAR(20),
    documents JSONB,
    "personalStatement" TEXT,
    "recommendationLetters" JSONB,
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    score DECIMAL(5,2),
    rank INTEGER,
    "isRecommended" BOOLEAN DEFAULT FALSE,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "awardedAmount" DECIMAL(15,2),
    CONSTRAINT fk_scholarship_applications_scholarship FOREIGN KEY ("scholarshipId") REFERENCES scholarships(id) ON DELETE CASCADE,
    CONSTRAINT fk_scholarship_applications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_scholarship_applications_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_scholarship_applications_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_scholarship_applications_scholarship_user UNIQUE ("scholarshipId", "userId")
);
-- CREATE INDEX idx_scholarship_applications_scholarshipId ON scholarship_applications("scholarshipId");
-- CREATE INDEX idx_scholarship_applications_userId ON scholarship_applications("userId");
-- CREATE INDEX idx_scholarship_applications_status ON scholarship_applications(status);

-- ۱۵۳. جدول آزمایشگاه‌ها
CREATE TABLE laboratories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    code VARCHAR(20) UNIQUE,
    type VARCHAR(50),
    "departmentId" INTEGER,
    building VARCHAR(100),
    floor INTEGER,
    room VARCHAR(20),
    capacity INTEGER,
    area DECIMAL(8,2),
    "managerId" BIGINT,
    "technicianId" BIGINT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    description TEXT,
    equipment JSONB,
    "safetyLevel" VARCHAR(20),
    "operatingHours" JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_laboratories_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_laboratories_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_laboratories_technician FOREIGN KEY ("technicianId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_laboratories_departmentId ON laboratories("departmentId");
-- CREATE INDEX idx_laboratories_type ON laboratories(type);
-- CREATE INDEX idx_laboratories_isActive ON laboratories("isActive");
CREATE TRIGGER trg_laboratories_updated_at
    BEFORE UPDATE ON laboratories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۴. جدول رزرو آزمایشگاه
CREATE TABLE laboratory_reservations (
    id SERIAL PRIMARY KEY,
    "laboratoryId" INTEGER,
    "userId" BIGINT,
    "courseId" INTEGER,
    "reservationDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    purpose TEXT,
    "participantsCount" INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_laboratory_reservations_lab FOREIGN KEY ("laboratoryId") REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT fk_laboratory_reservations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_laboratory_reservations_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_laboratory_reservations_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_laboratory_reservations_laboratoryId ON laboratory_reservations("laboratoryId");
-- CREATE INDEX idx_laboratory_reservations_userId ON laboratory_reservations("userId");
-- CREATE INDEX idx_laboratory_reservations_reservationDate ON laboratory_reservations("reservationDate");
-- CREATE INDEX idx_laboratory_reservations_status ON laboratory_reservations(status);
CREATE TRIGGER trg_laboratory_reservations_updated_at
    BEFORE UPDATE ON laboratory_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۵. جدول تجهیزات آزمایشگاهی
CREATE TABLE laboratory_equipment (
    id SERIAL PRIMARY KEY,
    "laboratoryId" INTEGER,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    code VARCHAR(50) UNIQUE,
    model VARCHAR(100),
    brand VARCHAR(100),
    "serialNumber" VARCHAR(100),
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    quantity INTEGER DEFAULT 1,
    "availableQuantity" INTEGER DEFAULT 1,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available',
    condition VARCHAR(30),
    "calibrationDate" DATE,
    "nextCalibrationDate" DATE,
    "warrantyExpiry" DATE,
    "manualUrl" VARCHAR(500),
    image VARCHAR(500),
    specifications JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_laboratory_equipment_lab FOREIGN KEY ("laboratoryId") REFERENCES laboratories(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_laboratory_equipment_laboratoryId ON laboratory_equipment("laboratoryId");
-- CREATE INDEX idx_laboratory_equipment_status ON laboratory_equipment(status);
-- CREATE INDEX idx_laboratory_equipment_isActive ON laboratory_equipment("isActive");
CREATE TRIGGER trg_laboratory_equipment_updated_at
    BEFORE UPDATE ON laboratory_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۶. جدول سالن‌های کنفرانس
CREATE TABLE conference_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    code VARCHAR(20) UNIQUE,
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER,
    area DECIMAL(8,2),
    facilities JSONB,
    equipment JSONB,
    "hourlyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT TRUE,
    images JSONB,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_conference_rooms_isActive ON conference_rooms("isActive");
-- CREATE INDEX idx_conference_rooms_capacity ON conference_rooms(capacity);
CREATE TRIGGER trg_conference_rooms_updated_at
    BEFORE UPDATE ON conference_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۷. جدول رزرو سالن کنفرانس
CREATE TABLE conference_room_reservations (
    id SERIAL PRIMARY KEY,
    "roomId" INTEGER,
    "userId" BIGINT,
    "eventTitle" VARCHAR(300) NOT NULL,
    "eventDescription" TEXT,
    "eventType" VARCHAR(50),
    "reservationDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "participantsCount" INTEGER,
    participants JSONB,
    "equipmentNeeded" JSONB,
    "cateringRequired" BOOLEAN DEFAULT FALSE,
    "setupRequired" BOOLEAN DEFAULT FALSE,
    "setupNotes" TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP,
    "cancelledBy" BIGINT,
    notes TEXT,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conf_room_reservations_room FOREIGN KEY ("roomId") REFERENCES conference_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_conf_room_reservations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conf_room_reservations_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_conf_room_reservations_cancelled_by FOREIGN KEY ("cancelledBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_conf_room_reservations_roomId ON conference_room_reservations("roomId");
-- CREATE INDEX idx_conf_room_reservations_userId ON conference_room_reservations("userId");
-- CREATE INDEX idx_conf_room_reservations_reservationDate ON conference_room_reservations("reservationDate");
-- CREATE INDEX idx_conf_room_reservations_status ON conference_room_reservations(status);
CREATE TRIGGER trg_conf_room_reservations_updated_at
    BEFORE UPDATE ON conference_room_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۸. جدول استاد راهنما
CREATE TABLE academic_advisors (
    id SERIAL PRIMARY KEY,
    "professorId" BIGINT NOT NULL,
    "academicTermId" INTEGER,
    "studentIds" JSONB,
    "maxStudents" INTEGER DEFAULT 10,
    "currentStudents" INTEGER DEFAULT 0,
    specialization VARCHAR(100),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_academic_advisors_professor FOREIGN KEY ("professorId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_academic_advisors_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT uk_academic_advisors_professor_term UNIQUE ("professorId", "academicTermId")
);
-- CREATE INDEX idx_academic_advisors_professorId ON academic_advisors("professorId");
-- CREATE INDEX idx_academic_advisors_academicTermId ON academic_advisors("academicTermId");
CREATE TRIGGER trg_academic_advisors_updated_at
    BEFORE UPDATE ON academic_advisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۵۹. جدول پروژه‌های دانشجویی
CREATE TABLE student_projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    "courseId" INTEGER,
    "professorId" BIGINT,
    "studentIds" JSONB,
    "startDate" DATE,
    "endDate" DATE,
    status VARCHAR(20) DEFAULT 'in_progress',
    progress INTEGER DEFAULT 0,
    grade DECIMAL(5,2),
    "gradeLetter" VARCHAR(5),
    "reportUrl" VARCHAR(500),
    "presentationUrl" VARCHAR(500),
    "sourceCodeUrl" VARCHAR(500),
    "demoUrl" VARCHAR(500),
    attachments JSONB,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_projects_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_student_projects_professor FOREIGN KEY ("professorId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_projects_type ON student_projects(type);
-- CREATE INDEX idx_student_projects_category ON student_projects(category);
-- CREATE INDEX idx_student_projects_professorId ON student_projects("professorId");
-- CREATE INDEX idx_student_projects_status ON student_projects(status);
CREATE TRIGGER trg_student_projects_updated_at
    BEFORE UPDATE ON student_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۶۰. جدول پیش‌نیازهای دروس
CREATE TABLE course_prerequisites (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "prerequisiteCourseId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN DEFAULT TRUE,
    "minimumGrade" VARCHAR(5),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_prerequisites_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_prerequisites_prerequisite FOREIGN KEY ("prerequisiteCourseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_course_prerequisites_course_prerequisite UNIQUE ("courseId", "prerequisiteCourseId")
);
-- CREATE INDEX idx_course_prerequisites_courseId ON course_prerequisites("courseId");
-- CREATE INDEX idx_course_prerequisites_prerequisiteCourseId ON course_prerequisites("prerequisiteCourseId");

-- ۱۶۱. جدول هم‌نیازهای دروس
CREATE TABLE course_corequisites (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "corequisiteCourseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_corequisites_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_corequisites_corequisite FOREIGN KEY ("corequisiteCourseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_course_corequisites_course_corequisite UNIQUE ("courseId", "corequisiteCourseId")
);
-- CREATE INDEX idx_course_corequisites_courseId ON course_corequisites("courseId");
-- CREATE INDEX idx_course_corequisites_corequisiteCourseId ON course_corequisites("corequisiteCourseId");

-- ۱۶۲. جدول برنامه تحصیلی
CREATE TABLE study_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    "facultyId" INTEGER,
    "departmentId" INTEGER,
    "studyLevel" VARCHAR(50),
    "studyType" VARCHAR(50),
    "totalCredits" INTEGER NOT NULL,
    "minGPA" DECIMAL(4,2),
    "durationTerms" INTEGER,
    "isActive" BOOLEAN DEFAULT TRUE,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_study_plans_faculty FOREIGN KEY ("facultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_study_plans_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_study_plans_facultyId ON study_plans("facultyId");
-- CREATE INDEX idx_study_plans_departmentId ON study_plans("departmentId");
-- CREATE INDEX idx_study_plans_studyLevel ON study_plans("studyLevel");
-- CREATE INDEX idx_study_plans_isActive ON study_plans("isActive");
CREATE TRIGGER trg_study_plans_updated_at
    BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۱۶۳ تا ۱۹۰)
-- ═══════════════════════════════════════════════════════════════════════

-- ۱۶۳. جدول دروس برنامه تحصیلی
CREATE TABLE study_plan_courses (
    id SERIAL PRIMARY KEY,
    "studyPlanId" INTEGER,
    "courseId" INTEGER,
    "termNumber" INTEGER NOT NULL,
    "courseType" VARCHAR(50),
    "isOptional" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_study_plan_courses_plan FOREIGN KEY ("studyPlanId") REFERENCES study_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_plan_courses_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_study_plan_courses_plan_course UNIQUE ("studyPlanId", "courseId")
);
-- CREATE INDEX idx_study_plan_courses_studyPlanId ON study_plan_courses("studyPlanId");
-- CREATE INDEX idx_study_plan_courses_termNumber ON study_plan_courses("termNumber");

-- ۱۶۴. جدول گزارش‌های آماده دانشجویی
CREATE TABLE student_reports (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "reportType" VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    parameters JSONB,
    "generatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" VARCHAR(500),
    "fileType" VARCHAR(20),
    "fileSize" INTEGER,
    "generatedBy" BIGINT,
    CONSTRAINT fk_student_reports_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_reports_generated_by FOREIGN KEY ("generatedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_reports_studentId ON student_reports("studentId");
-- CREATE INDEX idx_student_reports_reportType ON student_reports("reportType");
-- CREATE INDEX idx_student_reports_generatedAt ON student_reports("generatedAt");

-- ۱۶۵. جدول درخواست‌های انتقالی
CREATE TABLE transfer_requests (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "fromFacultyId" INTEGER,
    "toFacultyId" INTEGER,
    "fromDepartmentId" INTEGER,
    "toDepartmentId" INTEGER,
    "transferType" VARCHAR(50) NOT NULL,
    reason TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transfer_requests_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transfer_requests_from_faculty FOREIGN KEY ("fromFacultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_requests_to_faculty FOREIGN KEY ("toFacultyId") REFERENCES faculties(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_requests_from_dept FOREIGN KEY ("fromDepartmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_requests_to_dept FOREIGN KEY ("toDepartmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_requests_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_requests_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_transfer_requests_userId ON transfer_requests("userId");
-- CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
-- CREATE INDEX idx_transfer_requests_transferType ON transfer_requests("transferType");
CREATE TRIGGER trg_transfer_requests_updated_at
    BEFORE UPDATE ON transfer_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۶۶. جدول درخواست‌های مهمان
CREATE TABLE guest_requests (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "guestName" VARCHAR(100) NOT NULL,
    "guestNationalCode" VARCHAR(20),
    "guestPhone" VARCHAR(20),
    "guestEmail" VARCHAR(100),
    "visitReason" TEXT,
    "visitDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "hostUserId" BIGINT,
    "departmentId" INTEGER,
    location VARCHAR(200),
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "checkInTime" TIMESTAMP,
    "checkOutTime" TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guest_requests_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_guest_requests_host FOREIGN KEY ("hostUserId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_guest_requests_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_guest_requests_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_guest_requests_userId ON guest_requests("userId");
-- CREATE INDEX idx_guest_requests_visitDate ON guest_requests("visitDate");
-- CREATE INDEX idx_guest_requests_status ON guest_requests(status);
CREATE TRIGGER trg_guest_requests_updated_at
    BEFORE UPDATE ON guest_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۶۷. جدول بازدیدهای علمی
CREATE TABLE scientific_visits (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    destination VARCHAR(200),
    "visitDate" DATE NOT NULL,
    "returnDate" DATE,
    "transportationType" VARCHAR(50),
    "organizerId" BIGINT,
    "departmentId" INTEGER,
    "courseId" INTEGER,
    "studentIds" JSONB,
    "professorIds" JSONB,
    purpose TEXT,
    objectives TEXT,
    schedule JSONB,
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'planned',
    report TEXT,
    photos JSONB,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scientific_visits_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_scientific_visits_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_scientific_visits_course FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_scientific_visits_visitDate ON scientific_visits("visitDate");
-- CREATE INDEX idx_scientific_visits_status ON scientific_visits(status);
-- CREATE INDEX idx_scientific_visits_organizerId ON scientific_visits("organizerId");
CREATE TRIGGER trg_scientific_visits_updated_at
    BEFORE UPDATE ON scientific_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۶۸. جدول همایش‌ها و کنفرانس‌ها
CREATE TABLE conferences (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    "englishTitle" VARCHAR(300),
    acronym VARCHAR(20),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    level VARCHAR(20),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "registrationStart" DATE,
    "registrationEnd" DATE,
    "abstractSubmissionDeadline" DATE,
    "fullPaperDeadline" DATE,
    "reviewDeadline" DATE,
    "notificationDate" DATE,
    location VARCHAR(200),
    "isOnline" BOOLEAN DEFAULT FALSE,
    "onlinePlatform" VARCHAR(100),
    website VARCHAR(200),
    "organizerId" BIGINT,
    "organizingCommittee" JSONB,
    "scientificCommittee" JSONB,
    sponsors JSONB,
    topics JSONB,
    language VARCHAR(20),
    issn VARCHAR(20),
    "doiPrefix" VARCHAR(20),
    proceedings BOOLEAN DEFAULT FALSE,
    indexed BOOLEAN DEFAULT FALSE,
    "indexedIn" JSONB,
    "registrationFee" DECIMAL(12,2),
    "studentFee" DECIMAL(12,2),
    capacity INTEGER,
    "registeredCount" INTEGER DEFAULT 0,
    "acceptedPapersCount" INTEGER DEFAULT 0,
    "posterCount" INTEGER DEFAULT 0,
    "oralPresentationCount" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conferences_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_conferences_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_conferences_startDate ON conferences("startDate");
-- CREATE INDEX idx_conferences_type ON conferences(type);
-- CREATE INDEX idx_conferences_status ON conferences(status);
-- CREATE INDEX idx_conferences_isPublished ON conferences("isPublished");
CREATE TRIGGER trg_conferences_updated_at
    BEFORE UPDATE ON conferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۶۹. جدول ثبت‌نام همایش
CREATE TABLE conference_registrations (
    id SERIAL PRIMARY KEY,
    "conferenceId" INTEGER,
    "userId" BIGINT,
    "registrationType" VARCHAR(50),
    "presentationType" VARCHAR(50),
    "paperTitle" VARCHAR(300),
    abstract TEXT,
    authors JSONB,
    "isStudent" BOOLEAN DEFAULT FALSE,
    institution VARCHAR(200),
    country VARCHAR(100),
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentAmount" DECIMAL(12,2),
    "paymentDate" TIMESTAMP,
    "transactionId" VARCHAR(100),
    status VARCHAR(20) DEFAULT 'registered',
    "presentationTime" TIMESTAMP,
    "presentationRoom" VARCHAR(100),
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    feedback TEXT,
    rating INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conference_registrations_conference FOREIGN KEY ("conferenceId") REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_conference_registrations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_conference_registrations_conference_user UNIQUE ("conferenceId", "userId")
);
-- CREATE INDEX idx_conference_registrations_conferenceId ON conference_registrations("conferenceId");
-- CREATE INDEX idx_conference_registrations_userId ON conference_registrations("userId");
-- CREATE INDEX idx_conference_registrations_status ON conference_registrations(status);
CREATE TRIGGER trg_conference_registrations_updated_at
    BEFORE UPDATE ON conference_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۰. جدول مقالات علمی
CREATE TABLE scientific_papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    "titleFa" VARCHAR(500),
    "englishTitle" VARCHAR(500),
    abstract TEXT,
    "abstractFa" TEXT,
    keywords JSONB,
    authors JSONB,
    "correspondingAuthorId" BIGINT,
    "journalName" VARCHAR(200),
    "journalType" VARCHAR(50),
    volume VARCHAR(20),
    issue VARCHAR(20),
    pages VARCHAR(50),
    "publishDate" DATE,
    doi VARCHAR(100),
    url VARCHAR(500),
    publisher VARCHAR(200),
    "conferenceId" INTEGER,
    "indexedIn" JSONB,
    "impactFactor" DECIMAL(5,2),
    "citationCount" INTEGER DEFAULT 0,
    "downloadCount" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    "fileUrl" VARCHAR(500),
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scientific_papers_corresponding_author FOREIGN KEY ("correspondingAuthorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_scientific_papers_conference FOREIGN KEY ("conferenceId") REFERENCES conferences(id) ON DELETE SET NULL,
    CONSTRAINT fk_scientific_papers_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_scientific_papers_title ON scientific_papers(title);
-- CREATE INDEX idx_scientific_papers_status ON scientific_papers(status);
-- CREATE INDEX idx_scientific_papers_publishDate ON scientific_papers("publishDate");
-- CREATE INDEX idx_scientific_papers_doi ON scientific_papers(doi);
CREATE TRIGGER trg_scientific_papers_updated_at
    BEFORE UPDATE ON scientific_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۱. جدول پایان‌نامه‌ها
CREATE TABLE theses (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    "titleFa" VARCHAR(500),
    "englishTitle" VARCHAR(500),
    abstract TEXT,
    "abstractFa" TEXT,
    keywords JSONB,
    "supervisorId" BIGINT,
    "advisorIds" JSONB,
    "defenseDate" DATE,
    "defenseTime" TIME,
    "defenseLocation" VARCHAR(200),
    "defenseCommittee" JSONB,
    grade DECIMAL(5,2),
    "gradeLetter" VARCHAR(5),
    language VARCHAR(20),
    "pageCount" INTEGER,
    "referencesCount" INTEGER,
    "wordCount" INTEGER,
    university VARCHAR(200),
    institute VARCHAR(200),
    country VARCHAR(100),
    degree VARCHAR(50),
    "fieldOfStudy" VARCHAR(100),
    status VARCHAR(20) DEFAULT 'in_progress',
    "fileUrl" VARCHAR(500),
    "fileUrlFa" VARCHAR(500),
    "presentationUrl" VARCHAR(500),
    "sourceCodeUrl" VARCHAR(500),
    doi VARCHAR(100),
    "isPublished" BOOLEAN DEFAULT FALSE,
    "publishedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_theses_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_theses_supervisor FOREIGN KEY ("supervisorId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_theses_studentId ON theses("studentId");
-- CREATE INDEX idx_theses_status ON theses(status);
-- CREATE INDEX idx_theses_defenseDate ON theses("defenseDate");
-- CREATE INDEX idx_theses_degree ON theses(degree);
CREATE TRIGGER trg_theses_updated_at
    BEFORE UPDATE ON theses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۲. جدول جوایز و افتخارات
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    level VARCHAR(20),
    issuer VARCHAR(200),
    "awardDate" DATE,
    "recipientType" VARCHAR(50),
    "recipientId" BIGINT,
    "recipientName" VARCHAR(200),
    prize VARCHAR(200),
    "prizeValue" DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'IRR',
    "certificateUrl" VARCHAR(500),
    "photoUrl" VARCHAR(500),
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_awards_recipient FOREIGN KEY ("recipientId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_awards_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_awards_type ON awards(type);
-- CREATE INDEX idx_awards_category ON awards(category);
-- CREATE INDEX idx_awards_recipientId ON awards("recipientId");
-- CREATE INDEX idx_awards_awardDate ON awards("awardDate");
CREATE TRIGGER trg_awards_updated_at
    BEFORE UPDATE ON awards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۳. جدول مسابقات
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    description TEXT,
    "descriptionFa" TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    level VARCHAR(20),
    organizer VARCHAR(200),
    "startDate" DATE,
    "endDate" DATE,
    "registrationStart" DATE,
    "registrationEnd" DATE,
    location VARCHAR(200),
    "isOnline" BOOLEAN DEFAULT FALSE,
    website VARCHAR(200),
    "targetAudience" JSONB,
    requirements TEXT,
    rules TEXT,
    prizes TEXT,
    "maxParticipants" INTEGER,
    "registeredCount" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_competitions_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_competitions_type ON competitions(type);
-- CREATE INDEX idx_competitions_category ON competitions(category);
-- CREATE INDEX idx_competitions_startDate ON competitions("startDate");
-- CREATE INDEX idx_competitions_status ON competitions(status);
CREATE TRIGGER trg_competitions_updated_at
    BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۴. جدول ثبت‌نام مسابقه
CREATE TABLE competition_registrations (
    id SERIAL PRIMARY KEY,
    "competitionId" INTEGER,
    "userId" BIGINT,
    "teamName" VARCHAR(100),
    "teamMembers" JSONB,
    institution VARCHAR(200),
    "supervisorId" BIGINT,
    "registrationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    round INTEGER DEFAULT 1,
    score DECIMAL(5,2),
    rank INTEGER,
    result VARCHAR(20),
    "certificateIssued" BOOLEAN DEFAULT FALSE,
    "certificateNumber" VARCHAR(50),
    notes TEXT,
    CONSTRAINT fk_competition_registrations_competition FOREIGN KEY ("competitionId") REFERENCES competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_competition_registrations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_competition_registrations_supervisor FOREIGN KEY ("supervisorId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_competition_registrations_competition_user UNIQUE ("competitionId", "userId")
);
-- CREATE INDEX idx_competition_registrations_competitionId ON competition_registrations("competitionId");
-- CREATE INDEX idx_competition_registrations_userId ON competition_registrations("userId");
-- CREATE INDEX idx_competition_registrations_status ON competition_registrations(status);

-- ۱۷۵. جدول کارآموزی
CREATE TABLE internships (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "companyName" VARCHAR(200) NOT NULL,
    "companyIndustry" VARCHAR(100),
    "companyAddress" TEXT,
    "companyPhone" VARCHAR(20),
    "companyEmail" VARCHAR(100),
    "supervisorName" VARCHAR(100),
    "supervisorPhone" VARCHAR(20),
    "supervisorEmail" VARCHAR(100),
    "position" VARCHAR(200),
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "totalHours" INTEGER,
    "weeklyHours" INTEGER,
    description TEXT,
    tasks TEXT,
    "skillsAcquired" TEXT,
    evaluation JSONB,
    "finalGrade" DECIMAL(5,2),
    "gradeLetter" VARCHAR(5),
    "reportUrl" VARCHAR(500),
    "certificateUrl" VARCHAR(500),
    status VARCHAR(20) DEFAULT 'in_progress',
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_internships_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_internships_studentId ON internships("studentId");
-- CREATE INDEX idx_internships_companyName ON internships("companyName");
-- CREATE INDEX idx_internships_status ON internships(status);
-- CREATE INDEX idx_internships_startDate ON internships("startDate");
CREATE TRIGGER trg_internships_updated_at
    BEFORE UPDATE ON internships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۶. جدول درخواست‌های تغییر واحد/ترم
CREATE TABLE unit_change_requests (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "requestType" VARCHAR(50) NOT NULL,
    "currentTermId" INTEGER,
    "requestedTermId" INTEGER,
    "currentCourseId" INTEGER,
    "requestedCourseId" INTEGER,
    reason TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "reviewedBy" BIGINT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_unit_change_requests_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_unit_change_requests_current_term FOREIGN KEY ("currentTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_change_requests_requested_term FOREIGN KEY ("requestedTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_change_requests_current_course FOREIGN KEY ("currentCourseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_change_requests_requested_course FOREIGN KEY ("requestedCourseId") REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_change_requests_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_change_requests_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_unit_change_requests_studentId ON unit_change_requests("studentId");
-- CREATE INDEX idx_unit_change_requests_requestType ON unit_change_requests("requestType");
-- CREATE INDEX idx_unit_change_requests_status ON unit_change_requests(status);
CREATE TRIGGER trg_unit_change_requests_updated_at
    BEFORE UPDATE ON unit_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۷. جدول پرداخت‌های دانشجویی
CREATE TABLE student_payments (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "paymentType" VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IRR',
    "academicTermId" INTEGER,
    description TEXT,
    "invoiceId" INTEGER,
    "transactionId" VARCHAR(100),
    "paymentMethod" VARCHAR(30),
    "paymentGateway" VARCHAR(50),
    "gatewayTransactionId" VARCHAR(100),
    "referenceNumber" VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    "paidAt" TIMESTAMP,
    "failureReason" VARCHAR(200),
    "receiptUrl" VARCHAR(500),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_payments_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_payments_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_student_payments_invoice FOREIGN KEY ("invoiceId") REFERENCES invoices(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_payments_studentId ON student_payments("studentId");
-- CREATE INDEX idx_student_payments_paymentType ON student_payments("paymentType");
-- CREATE INDEX idx_student_payments_status ON student_payments(status);
-- CREATE INDEX idx_student_payments_academicTermId ON student_payments("academicTermId");
CREATE TRIGGER trg_student_payments_updated_at
    BEFORE UPDATE ON student_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۸. جدول بدهی‌های دانشجویی
CREATE TABLE student_debts (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "debtType" VARCHAR(50) NOT NULL,
    "academicTermId" INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IRR',
    description TEXT,
    "dueDate" DATE,
    status VARCHAR(20) DEFAULT 'unpaid',
    "paidAmount" DECIMAL(15,2) DEFAULT 0,
    "paidAt" TIMESTAMP,
    "reminderSent" BOOLEAN DEFAULT FALSE,
    "lastReminderDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_debts_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_debts_term FOREIGN KEY ("academicTermId") REFERENCES academic_terms(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_debts_studentId ON student_debts("studentId");
-- CREATE INDEX idx_student_debts_debtType ON student_debts("debtType");
-- CREATE INDEX idx_student_debts_status ON student_debts(status);
-- CREATE INDEX idx_student_debts_dueDate ON student_debts("dueDate");
CREATE TRIGGER trg_student_debts_updated_at
    BEFORE UPDATE ON student_debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۷۹. جدول تخفیف‌ها
CREATE TABLE discounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    description TEXT,
    "descriptionFa" TEXT,
    "discountType" VARCHAR(20) NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "maxDiscountAmount" DECIMAL(15,2),
    "minPurchaseAmount" DECIMAL(15,2),
    "applicableTypes" JSONB,
    "applicableItems" JSONB,
    "userId" BIGINT,
    "usageLimit" INTEGER,
    "usedCount" INTEGER DEFAULT 0,
    "usagePerUser" INTEGER,
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discounts_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_discounts_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_discounts_code ON discounts(code);
-- CREATE INDEX idx_discounts_isActive ON discounts("isActive");
-- CREATE INDEX idx_discounts_startDate ON discounts("startDate");
-- CREATE INDEX idx_discounts_endDate ON discounts("endDate");
CREATE TRIGGER trg_discounts_updated_at
    BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۸۰. جدول استفاده از تخفیف
CREATE TABLE discount_usages (
    id SERIAL PRIMARY KEY,
    "discountId" INTEGER,
    "userId" BIGINT,
    "orderId" BIGINT,
    "discountAmount" DECIMAL(15,2),
    "usedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discount_usages_discount FOREIGN KEY ("discountId") REFERENCES discounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_discount_usages_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_discount_usages_discountId ON discount_usages("discountId");
-- CREATE INDEX idx_discount_usages_userId ON discount_usages("userId");
-- CREATE INDEX idx_discount_usages_usedAt ON discount_usages("usedAt");

-- ۱۸۱. جدول سطل آشغال دانشجویی
CREATE TABLE student_trash (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "itemType" VARCHAR(50) NOT NULL,
    "itemId" BIGINT NOT NULL,
    "deletedData" JSONB NOT NULL,
    "deleteReason" TEXT,
    "deletedBy" BIGINT,
    "restoredAt" TIMESTAMP,
    "restoredBy" BIGINT,
    "permanentDeletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_trash_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_trash_deleted_by FOREIGN KEY ("deletedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_student_trash_restored_by FOREIGN KEY ("restoredBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_trash_studentId ON student_trash("studentId");
-- CREATE INDEX idx_student_trash_itemType ON student_trash("itemType");
-- CREATE INDEX idx_student_trash_itemId ON student_trash("itemId");

-- ۱۸۲. جدول لاگ تغییرات دانشجو
CREATE TABLE student_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    "studentId" BIGINT,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changedBy" BIGINT,
    "ipAddress" VARCHAR(45),
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_audit_logs_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_audit_logs_changed_by FOREIGN KEY ("changedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_student_audit_logs_studentId ON student_audit_logs("studentId");
-- CREATE INDEX idx_student_audit_logs_action ON student_audit_logs(action);
-- CREATE INDEX idx_student_audit_logs_changedBy ON student_audit_logs("changedBy");
-- CREATE INDEX idx_student_audit_logs_createdAt ON student_audit_logs("createdAt");

-- ۱۸۳. جدول یادآورهای تحصیلی
CREATE TABLE academic_reminders (
    id SERIAL PRIMARY KEY,
    "studentId" BIGINT,
    "reminderType" VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    description TEXT,
    "remindAt" TIMESTAMP NOT NULL,
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" BIGINT,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP,
    "notifyByEmail" BOOLEAN DEFAULT TRUE,
    "notifyBySms" BOOLEAN DEFAULT FALSE,
    "notifyByPush" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_academic_reminders_student FOREIGN KEY ("studentId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_academic_reminders_studentId ON academic_reminders("studentId");
-- CREATE INDEX idx_academic_reminders_reminderType ON academic_reminders("reminderType");
-- CREATE INDEX idx_academic_reminders_remindAt ON academic_reminders("remindAt");
-- CREATE INDEX idx_academic_reminders_isCompleted ON academic_reminders("isCompleted");
CREATE TRIGGER trg_academic_reminders_updated_at
    BEFORE UPDATE ON academic_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۸۴. جدول گزارش‌های دوره‌ای
CREATE TABLE periodic_reports (
    id SERIAL PRIMARY KEY,
    "reportType" VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    description TEXT,
    "scheduleType" VARCHAR(20) NOT NULL,
    schedule JSONB,
    parameters JSONB,
    recipients JSONB,
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastRunAt" TIMESTAMP,
    "nextRunAt" TIMESTAMP,
    "lastStatus" VARCHAR(20),
    "lastError" TEXT,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_periodic_reports_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_periodic_reports_reportType ON periodic_reports("reportType");
-- CREATE INDEX idx_periodic_reports_scheduleType ON periodic_reports("scheduleType");
-- CREATE INDEX idx_periodic_reports_isActive ON periodic_reports("isActive");
CREATE TRIGGER trg_periodic_reports_updated_at
    BEFORE UPDATE ON periodic_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۸۵. جدول اجرای گزارش‌های دوره‌ای
CREATE TABLE periodic_report_runs (
    id SERIAL PRIMARY KEY,
    "reportId" INTEGER,
    "startedAt" TIMESTAMP NOT NULL,
    "completedAt" TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running',
    "fileUrl" VARCHAR(500),
    "fileSize" BIGINT,
    recipients JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_periodic_report_runs_report FOREIGN KEY ("reportId") REFERENCES periodic_reports(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_periodic_report_runs_reportId ON periodic_report_runs("reportId");
-- CREATE INDEX idx_periodic_report_runs_startedAt ON periodic_report_runs("startedAt");
-- CREATE INDEX idx_periodic_report_runs_status ON periodic_report_runs(status);

-- ۱۸۶. جدول سطوح دسترسی فیلد
CREATE TABLE field_permissions (
    id SERIAL PRIMARY KEY,
    "entityType" VARCHAR(50) NOT NULL,
    "fieldName" VARCHAR(50) NOT NULL,
    "roleId" INTEGER,
    "userId" BIGINT,
    permission VARCHAR(20) NOT NULL,
    conditions JSONB,
    "grantedBy" BIGINT,
    "grantedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    CONSTRAINT fk_field_permissions_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_field_permissions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_field_permissions_granted_by FOREIGN KEY ("grantedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_field_permissions_entityType ON field_permissions("entityType");
-- CREATE INDEX idx_field_permissions_fieldName ON field_permissions("fieldName");
-- CREATE INDEX idx_field_permissions_roleId ON field_permissions("roleId");
-- CREATE INDEX idx_field_permissions_userId ON field_permissions("userId");

-- ۱۸۷. جدول قوانین و مقررات
CREATE TABLE regulations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50),
    category VARCHAR(50),
    content TEXT,
    "contentFa" TEXT,
    attachments JSONB,
    "effectiveDate" DATE,
    "expiryDate" DATE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "isPublic" BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    "previousVersionId" INTEGER,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_regulations_previous_version FOREIGN KEY ("previousVersionId") REFERENCES regulations(id) ON DELETE SET NULL,
    CONSTRAINT fk_regulations_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_regulations_type ON regulations(type);
-- CREATE INDEX idx_regulations_category ON regulations(category);
-- CREATE INDEX idx_regulations_isActive ON regulations("isActive");
-- CREATE INDEX idx_regulations_effectiveDate ON regulations("effectiveDate");
CREATE TRIGGER trg_regulations_updated_at
    BEFORE UPDATE ON regulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۸۸. جدول تأیید قوانین
CREATE TABLE regulation_acceptances (
    id SERIAL PRIMARY KEY,
    "regulationId" INTEGER,
    "userId" BIGINT,
    "ipAddress" VARCHAR(45),
    "acceptedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_regulation_acceptances_regulation FOREIGN KEY ("regulationId") REFERENCES regulations(id) ON DELETE CASCADE,
    CONSTRAINT fk_regulation_acceptances_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_regulation_acceptances_regulation_user UNIQUE ("regulationId", "userId")
);
-- CREATE INDEX idx_regulation_acceptances_regulationId ON regulation_acceptances("regulationId");
-- CREATE INDEX idx_regulation_acceptances_userId ON regulation_acceptances("userId");

-- ۱۸۹. جدول سؤالات متداول
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    "questionFa" TEXT,
    answer TEXT NOT NULL,
    "answerFa" TEXT,
    category VARCHAR(50),
    tags JSONB,
    "viewCount" INTEGER DEFAULT 0,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_faqs_category ON faqs(category);
-- CREATE INDEX idx_faqs_isFeatured ON faqs("isFeatured");
-- CREATE INDEX idx_faqs_isActive ON faqs("isActive");
CREATE TRIGGER trg_faqs_updated_at
    BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۰. جدول تماس با ما
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    department VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    "assignedTo" BIGINT,
    response TEXT,
    "respondedBy" BIGINT,
    "respondedAt" TIMESTAMP,
    attachments JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_messages_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_contact_messages_responded_by FOREIGN KEY ("respondedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_contact_messages_status ON contact_messages(status);
-- CREATE INDEX idx_contact_messages_department ON contact_messages(department);
-- CREATE INDEX idx_contact_messages_createdAt ON contact_messages("createdAt");
CREATE TRIGGER trg_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
--                 ادامه اسکیمای PostgreSQL (جداول ۱۹۱ تا ۲۱۲)
-- ═══════════════════════════════════════════════════════════════════════

-- ۱۹۱. جدول نظرسنجی رضایت
CREATE TABLE satisfaction_surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    "titleFa" VARCHAR(200),
    description TEXT,
    "descriptionFa" TEXT,
    "targetType" VARCHAR(50),
    "targetId" BIGINT,
    questions JSONB NOT NULL,
    settings JSONB,
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "isAnonymous" BOOLEAN DEFAULT FALSE,
    "showResults" BOOLEAN DEFAULT FALSE,
    "responseCount" INTEGER DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'draft',
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_satisfaction_surveys_target FOREIGN KEY ("targetId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_satisfaction_surveys_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_satisfaction_surveys_status ON satisfaction_surveys(status);
-- CREATE INDEX idx_satisfaction_surveys_targetType ON satisfaction_surveys("targetType");
CREATE TRIGGER trg_satisfaction_surveys_updated_at
    BEFORE UPDATE ON satisfaction_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۲. جدول پاسخ نظرسنجی رضایت
CREATE TABLE satisfaction_responses (
    id SERIAL PRIMARY KEY,
    "surveyId" INTEGER,
    "userId" BIGINT,
    responses JSONB NOT NULL,
    "overallRating" DECIMAL(3,2),
    comment TEXT,
    "ipAddress" VARCHAR(45),
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_satisfaction_responses_survey FOREIGN KEY ("surveyId") REFERENCES satisfaction_surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_satisfaction_responses_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_satisfaction_responses_survey_user UNIQUE ("surveyId", "userId")
);
-- CREATE INDEX idx_satisfaction_responses_surveyId ON satisfaction_responses("surveyId");
-- CREATE INDEX idx_satisfaction_responses_submittedAt ON satisfaction_responses("submittedAt");

-- ۱۹۳. جدول سرویس‌های تغذیه
CREATE TABLE dining_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    type VARCHAR(50),
    location VARCHAR(200),
    capacity INTEGER,
    "operatingHours" JSONB,
    "managerId" BIGINT,
    phone VARCHAR(20),
    email VARCHAR(100),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dining_services_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_dining_services_type ON dining_services(type);
-- CREATE INDEX idx_dining_services_isActive ON dining_services("isActive");
CREATE TRIGGER trg_dining_services_updated_at
    BEFORE UPDATE ON dining_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۴. جدول منوهای تغذیه
CREATE TABLE dining_menus (
    id SERIAL PRIMARY KEY,
    "diningServiceId" INTEGER,
    "mealType" VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL,
    calories INTEGER,
    price DECIMAL(10,2),
    "isAvailable" BOOLEAN DEFAULT TRUE,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dining_menus_service FOREIGN KEY ("diningServiceId") REFERENCES dining_services(id) ON DELETE CASCADE,
    CONSTRAINT uk_dining_menus_service_date_meal UNIQUE ("diningServiceId", date, "mealType")
);
-- CREATE INDEX idx_dining_menus_date ON dining_menus(date);
-- CREATE INDEX idx_dining_menus_mealType ON dining_menus("mealType");
CREATE TRIGGER trg_dining_menus_updated_at
    BEFORE UPDATE ON dining_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۵. جدول رزرو تغذیه
CREATE TABLE dining_reservations (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "diningServiceId" INTEGER,
    "mealType" VARCHAR(50) NOT NULL,
    "reservationDate" DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'reserved',
    "cancelledAt" TIMESTAMP,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dining_reservations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dining_reservations_service FOREIGN KEY ("diningServiceId") REFERENCES dining_services(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_dining_reservations_userId ON dining_reservations("userId");
-- CREATE INDEX idx_dining_reservations_reservationDate ON dining_reservations("reservationDate");
-- CREATE INDEX idx_dining_reservations_status ON dining_reservations(status);

-- ۱۹۶. جدول باشگاه ورزشی
CREATE TABLE sports_clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    type VARCHAR(50),
    sport VARCHAR(50),
    description TEXT,
    "descriptionFa" TEXT,
    location VARCHAR(200),
    capacity INTEGER,
    "operatingHours" JSONB,
    "coachId" BIGINT,
    "managerId" BIGINT,
    phone VARCHAR(20),
    email VARCHAR(100),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sports_clubs_coach FOREIGN KEY ("coachId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_sports_clubs_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_sports_clubs_type ON sports_clubs(type);
-- CREATE INDEX idx_sports_clubs_sport ON sports_clubs(sport);
-- CREATE INDEX idx_sports_clubs_isActive ON sports_clubs("isActive");
CREATE TRIGGER trg_sports_clubs_updated_at
    BEFORE UPDATE ON sports_clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۷. جدول اعضای باشگاه ورزشی
CREATE TABLE sports_club_members (
    id SERIAL PRIMARY KEY,
    "clubId" INTEGER,
    "userId" BIGINT,
    "membershipType" VARCHAR(50),
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    status VARCHAR(20) DEFAULT 'active',
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentAmount" DECIMAL(10,2),
    "paymentDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sports_club_members_club FOREIGN KEY ("clubId") REFERENCES sports_clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_sports_club_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_sports_club_members_club_user UNIQUE ("clubId", "userId")
);
-- CREATE INDEX idx_sports_club_members_clubId ON sports_club_members("clubId");
-- CREATE INDEX idx_sports_club_members_userId ON sports_club_members("userId");
-- CREATE INDEX idx_sports_club_members_status ON sports_club_members(status);
CREATE TRIGGER trg_sports_club_members_updated_at
    BEFORE UPDATE ON sports_club_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۸. جدول مسابقات ورزشی
CREATE TABLE sports_competitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    sport VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    level VARCHAR(20),
    description TEXT,
    "startDate" DATE,
    "endDate" DATE,
    location VARCHAR(200),
    "organizerId" BIGINT,
    "participantsCount" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planned',
    results JSONB,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sports_competitions_organizer FOREIGN KEY ("organizerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_sports_competitions_sport ON sports_competitions(sport);
-- CREATE INDEX idx_sports_competitions_startDate ON sports_competitions("startDate");
-- CREATE INDEX idx_sports_competitions_status ON sports_competitions(status);
CREATE TRIGGER trg_sports_competitions_updated_at
    BEFORE UPDATE ON sports_competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۱۹۹. جدول شرکت در مسابقات ورزشی
CREATE TABLE sports_competition_participants (
    id SERIAL PRIMARY KEY,
    "competitionId" INTEGER,
    "userId" BIGINT,
    "teamName" VARCHAR(100),
    "teamMembers" JSONB,
    "position" INTEGER,
    medal VARCHAR(20),
    score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'registered',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sports_competition_participants_comp FOREIGN KEY ("competitionId") REFERENCES sports_competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sports_competition_participants_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_sports_comp_participants_comp_user UNIQUE ("competitionId", "userId")
);
-- CREATE INDEX idx_sports_comp_participants_competitionId ON sports_competition_participants("competitionId");
-- CREATE INDEX idx_sports_comp_participants_userId ON sports_competition_participants("userId");

-- ۲۰۰. جدول سالن‌های ورزشی
CREATE TABLE sports_facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    type VARCHAR(50) NOT NULL,
    "sportType" VARCHAR(50),
    location VARCHAR(200),
    capacity INTEGER,
    area DECIMAL(8,2),
    facilities JSONB,
    equipment JSONB,
    "operatingHours" JSONB,
    "hourlyRate" DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT TRUE,
    images JSONB,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_sports_facilities_type ON sports_facilities(type);
-- CREATE INDEX idx_sports_facilities_sportType ON sports_facilities("sportType");
-- CREATE INDEX idx_sports_facilities_isActive ON sports_facilities("isActive");
CREATE TRIGGER trg_sports_facilities_updated_at
    BEFORE UPDATE ON sports_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۱. جدول رزرو امکانات ورزشی
CREATE TABLE sports_facility_reservations (
    id SERIAL PRIMARY KEY,
    "facilityId" INTEGER,
    "userId" BIGINT,
    "reservationDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    purpose VARCHAR(200),
    "participantsCount" INTEGER,
    "equipmentNeeded" JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP,
    "cancelledBy" BIGINT,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sports_facility_reservations_facility FOREIGN KEY ("facilityId") REFERENCES sports_facilities(id) ON DELETE CASCADE,
    CONSTRAINT fk_sports_facility_reservations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sports_facility_reservations_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_sports_facility_reservations_cancelled_by FOREIGN KEY ("cancelledBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_sports_facility_reservations_facilityId ON sports_facility_reservations("facilityId");
-- CREATE INDEX idx_sports_facility_reservations_userId ON sports_facility_reservations("userId");
-- CREATE INDEX idx_sports_facility_reservations_reservationDate ON sports_facility_reservations("reservationDate");
-- CREATE INDEX idx_sports_facility_reservations_status ON sports_facility_reservations(status);
CREATE TRIGGER trg_sports_facility_reservations_updated_at
    BEFORE UPDATE ON sports_facility_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۲. جدول اجاره تجهیزات
CREATE TABLE equipment_rentals (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "equipmentId" INTEGER,
    "rentalDate" DATE NOT NULL,
    "returnDate" DATE,
    quantity INTEGER DEFAULT 1,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    "approvedBy" BIGINT,
    "approvedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "actualReturnDate" DATE,
    "conditionReturned" VARCHAR(30),
    "lateFee" DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_rentals_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_rentals_equipment FOREIGN KEY ("equipmentId") REFERENCES inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_rentals_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_equipment_rentals_userId ON equipment_rentals("userId");
-- CREATE INDEX idx_equipment_rentals_equipmentId ON equipment_rentals("equipmentId");
-- CREATE INDEX idx_equipment_rentals_rentalDate ON equipment_rentals("rentalDate");
-- CREATE INDEX idx_equipment_rentals_status ON equipment_rentals(status);
CREATE TRIGGER trg_equipment_rentals_updated_at
    BEFORE UPDATE ON equipment_rentals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۳. جدول اشیای گمشده
CREATE TABLE lost_and_found (
    id SERIAL PRIMARY KEY,
    "itemName" VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    "foundLocation" VARCHAR(200),
    "foundDate" DATE,
    "foundBy" BIGINT,
    "ownerId" BIGINT,
    status VARCHAR(20) DEFAULT 'found',
    "claimedAt" TIMESTAMP,
    "claimedBy" BIGINT,
    image VARCHAR(500),
    images JSONB,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lost_and_found_found_by FOREIGN KEY ("foundBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_lost_and_found_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_lost_and_found_claimed_by FOREIGN KEY ("claimedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_lost_and_found_category ON lost_and_found(category);
-- CREATE INDEX idx_lost_and_found_status ON lost_and_found(status);
-- CREATE INDEX idx_lost_and_found_foundDate ON lost_and_found("foundDate");
CREATE TRIGGER trg_lost_and_found_updated_at
    BEFORE UPDATE ON lost_and_found FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۴. جدول پارکینگ
CREATE TABLE parking (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(100),
    location VARCHAR(200),
    capacity INTEGER,
    "capacityCars" INTEGER,
    "capacityMotorcycles" INTEGER,
    "capacityBicycles" INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "monthlyRate" DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "operatingHours" JSONB,
    facilities JSONB,
    "managerId" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parking_manager FOREIGN KEY ("managerId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_parking_isActive ON parking("isActive");
-- CREATE INDEX idx_parking_location ON parking(location);
CREATE TRIGGER trg_parking_updated_at
    BEFORE UPDATE ON parking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۵. جدول ثبت خودرو
CREATE TABLE registered_vehicles (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT,
    "plateNumber" VARCHAR(20) NOT NULL,
    "vehicleType" VARCHAR(50),
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    year INTEGER,
    "parkingId" INTEGER,
    "permitType" VARCHAR(50),
    "permitStartDate" DATE,
    "permitEndDate" DATE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "rfidTag" VARCHAR(50),
    image VARCHAR(500),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_registered_vehicles_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_registered_vehicles_parking FOREIGN KEY ("parkingId") REFERENCES parking(id) ON DELETE SET NULL,
    CONSTRAINT uk_registered_vehicles_plate UNIQUE ("plateNumber")
);
-- CREATE INDEX idx_registered_vehicles_userId ON registered_vehicles("userId");
-- CREATE INDEX idx_registered_vehicles_parkingId ON registered_vehicles("parkingId");
-- CREATE INDEX idx_registered_vehicles_isActive ON registered_vehicles("isActive");
CREATE TRIGGER trg_registered_vehicles_updated_at
    BEFORE UPDATE ON registered_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۶. جدول تردد پارکینگ
CREATE TABLE parking_logs (
    id SERIAL PRIMARY KEY,
    "vehicleId" INTEGER,
    "userId" BIGINT,
    "parkingId" INTEGER,
    "entryTime" TIMESTAMP NOT NULL,
    "exitTime" TIMESTAMP,
    "durationMinutes" INTEGER,
    "parkingFee" DECIMAL(10,2),
    "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
    "paymentMethod" VARCHAR(30),
    "transactionId" VARCHAR(100),
    "paymentTime" TIMESTAMP,
    gate VARCHAR(50),
    "photoEntry" VARCHAR(500),
    "photoExit" VARCHAR(500),
    status VARCHAR(20) DEFAULT 'parked',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parking_logs_vehicle FOREIGN KEY ("vehicleId") REFERENCES registered_vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parking_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_parking_logs_parking FOREIGN KEY ("parkingId") REFERENCES parking(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_parking_logs_vehicleId ON parking_logs("vehicleId");
-- CREATE INDEX idx_parking_logs_userId ON parking_logs("userId");
-- CREATE INDEX idx_parking_logs_entryTime ON parking_logs("entryTime");
-- CREATE INDEX idx_parking_logs_paymentStatus ON parking_logs("paymentStatus");

-- ۲۰۷. جدول بازدیدکنندگان
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    "fullName" VARCHAR(100) NOT NULL,
    "nationalCode" VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    organization VARCHAR(200),
    "visitPurpose" VARCHAR(200),
    "hostUserId" BIGINT,
    "departmentId" INTEGER,
    "visitDate" DATE NOT NULL,
    "entryTime" TIME,
    "exitTime" TIME,
    "badgeNumber" VARCHAR(50),
    photo VARCHAR(500),
    signature VARCHAR(500),
    items JSONB,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'registered',
    "checkedOutAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visitors_host_user FOREIGN KEY ("hostUserId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_visitors_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_visitors_hostUserId ON visitors("hostUserId");
-- CREATE INDEX idx_visitors_visitDate ON visitors("visitDate");
-- CREATE INDEX idx_visitors_status ON visitors(status);
CREATE TRIGGER trg_visitors_updated_at
    BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۸. جدول دارایی‌های IT
CREATE TABLE it_assets (
    id SERIAL PRIMARY KEY,
    "assetTag" VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    type VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    "serialNumber" VARCHAR(100),
    "macAddress" VARCHAR(50),
    "ipAddress" VARCHAR(45),
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(12,2),
    "warrantyExpiry" DATE,
    "assignedTo" BIGINT,
    "assignedAt" TIMESTAMP,
    location VARCHAR(200),
    "departmentId" INTEGER,
    status VARCHAR(20) DEFAULT 'available',
    condition VARCHAR(30),
    specifications JSONB,
    notes TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_it_assets_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_it_assets_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_it_assets_category ON it_assets(category);
-- CREATE INDEX idx_it_assets_assignedTo ON it_assets("assignedTo");
-- CREATE INDEX idx_it_assets_status ON it_assets(status);
-- CREATE INDEX idx_it_assets_isActive ON it_assets("isActive");
CREATE TRIGGER trg_it_assets_updated_at
    BEFORE UPDATE ON it_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۰۹. جدول لایسنس‌های نرم‌افزاری
CREATE TABLE software_licenses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "nameFa" VARCHAR(200),
    vendor VARCHAR(100),
    version VARCHAR(50),
    "licenseType" VARCHAR(50),
    "licenseKey" VARCHAR(500),
    "licenseCount" INTEGER,
    "usedCount" INTEGER DEFAULT 0,
    "purchaseDate" DATE,
    "expiryDate" DATE,
    cost DECIMAL(12,2),
    "renewalCost" DECIMAL(12,2),
    "assignedTo" BIGINT,
    "assignedAt" TIMESTAMP,
    "departmentId" INTEGER,
    "isActive" BOOLEAN DEFAULT TRUE,
    "isRenewable" BOOLEAN DEFAULT FALSE,
    "renewalReminderDays" INTEGER DEFAULT 30,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_software_licenses_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_software_licenses_department FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_software_licenses_name ON software_licenses(name);
-- CREATE INDEX idx_software_licenses_licenseType ON software_licenses("licenseType");
-- CREATE INDEX idx_software_licenses_expiryDate ON software_licenses("expiryDate");
-- CREATE INDEX idx_software_licenses_isActive ON software_licenses("isActive");
CREATE TRIGGER trg_software_licenses_updated_at
    BEFORE UPDATE ON software_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۱۰. جدول تیکت‌های پشتیبانی
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    "ticketNumber" VARCHAR(50) UNIQUE NOT NULL,
    "userId" BIGINT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    subject VARCHAR(300) NOT NULL,
    description TEXT,
    attachments JSONB,
    "assignedTo" BIGINT,
    "assignedAt" TIMESTAMP,
    status VARCHAR(20) DEFAULT 'open',
    resolution TEXT,
    "resolvedBy" BIGINT,
    "resolvedAt" TIMESTAMP,
    rating INTEGER,
    feedback TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP,
    CONSTRAINT fk_support_tickets_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_tickets_assigned_to FOREIGN KEY ("assignedTo") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_support_tickets_resolved_by FOREIGN KEY ("resolvedBy") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_support_tickets_userId ON support_tickets("userId");
-- CREATE INDEX idx_support_tickets_category ON support_tickets(category);
-- CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
-- CREATE INDEX idx_support_tickets_status ON support_tickets(status);
-- CREATE INDEX idx_support_tickets_assignedTo ON support_tickets("assignedTo");
CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۱۱. جدول پاسخ‌های تیکت
CREATE TABLE ticket_replies (
    id SERIAL PRIMARY KEY,
    "ticketId" INTEGER,
    "userId" BIGINT,
    message TEXT NOT NULL,
    attachments JSONB,
    "isInternal" BOOLEAN DEFAULT FALSE,
    "isSolution" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_replies_ticket FOREIGN KEY ("ticketId") REFERENCES support_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_replies_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_ticket_replies_ticketId ON ticket_replies("ticketId");
-- CREATE INDEX idx_ticket_replies_userId ON ticket_replies("userId");
CREATE TRIGGER trg_ticket_replies_updated_at
    BEFORE UPDATE ON ticket_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ۲۱۲. جدول دانش‌نامه (Knowledge Base)
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    "titleFa" VARCHAR(300),
    content TEXT,
    "contentFa" TEXT,
    category VARCHAR(50),
    tags JSONB,
    "authorId" BIGINT,
    "viewCount" INTEGER DEFAULT 0,
    "helpfulCount" INTEGER DEFAULT 0,
    "notHelpfulCount" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT FALSE,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_knowledge_base_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
-- CREATE INDEX idx_knowledge_base_status ON knowledge_base(status);
-- CREATE INDEX idx_knowledge_base_isFeatured ON knowledge_base("isFeatured");
CREATE TRIGGER trg_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ═══════════════════════════════════════════════════════════════════════
--           ماژول‌های پیشرفته: اخبار، پخش زنده، کلاس مجازی و ...
--        تبدیل و گسترش برای PostgreSQL با حفظ ساختار و بهبود کارایی
-- ═══════════════════════════════════════════════════════════════════════

-- تابع کمکی برای به‌روزرسانی خودکار (قبلاً در بخش اول تعریف شده، در صورت نیاز مجدد)
-- CREATE OR REPLACE FUNCTION update_updated_at_column() ...

-- ایجاد ENUM ها برای یکپارچگی داده‌ها
CREATE TYPE news_status_enum AS ENUM ('draft', 'pending', 'published', 'archived');
CREATE TYPE stream_status_enum AS ENUM ('scheduled', 'live', 'ended', 'cancelled', 'processing');
CREATE TYPE stream_visibility_enum AS ENUM ('public', 'private', 'course_only', 'special');
CREATE TYPE courseware_type_enum AS ENUM ('interactive', 'simulation', 'presentation', 'document', 'scorm');
CREATE TYPE courseware_access_enum AS ENUM ('public', 'registered', 'course_only', 'premium');
CREATE TYPE class_platform_enum AS ENUM ('bigbluebutton', 'zoom', 'meet', 'webex', 'internal');
CREATE TYPE class_status_enum AS ENUM ('scheduled', 'active', 'ended', 'cancelled');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE content_type_enum AS ENUM ('html', 'markdown', 'json', 'text');
CREATE TYPE broadcast_target_enum AS ENUM ('all', 'role', 'course', 'specific_users');
CREATE TYPE broadcast_status_enum AS ENUM ('draft', 'scheduled', 'sent', 'failed');
CREATE TYPE broadcast_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE communication_type_enum AS ENUM ('incoming', 'outgoing', 'internal');
CREATE TYPE domain_access_enum AS ENUM ('whitelist', 'blacklist', 'graylist');
CREATE TYPE domain_category_enum AS ENUM ('academic', 'journal', 'database', 'publisher', 'repository', 'other');

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۳. جدول دسته‌بندی اخبار
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER,
    icon VARCHAR(255),
    color VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_categories_parent FOREIGN KEY (parent_id) REFERENCES news_categories(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_news_categories_slug ON news_categories(slug);
-- CREATE INDEX idx_news_categories_parent ON news_categories(parent_id);
CREATE TRIGGER trg_news_categories_updated_at
    BEFORE UPDATE ON news_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۴. جدول اخبار (نسخه گسترش‌یافته)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    images JSONB DEFAULT '[]',
    category_id INTEGER,
    tags JSONB DEFAULT '[]',
    status news_status_enum DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_breaking BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    meta_keywords VARCHAR(300),
    canonical_url VARCHAR(500),
    author_id BIGINT,
    editor_id BIGINT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_category FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_news_editor FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ایندکس‌های پیشرفته
-- CREATE INDEX idx_news_slug ON news(slug);
-- CREATE INDEX idx_news_status ON news(status);
-- CREATE INDEX idx_news_published_at ON news(published_at);
-- CREATE INDEX idx_news_featured ON news(is_featured);
-- CREATE INDEX idx_news_author ON news(author_id);
-- CREATE INDEX idx_news_category ON news(category_id);
-- CREATE INDEX idx_news_tags ON news USING GIN (tags);
-- CREATE INDEX idx_news_images ON news USING GIN (images);
-- جستجوی تمام متن PostgreSQL
-- CREATE INDEX idx_news_search ON news USING GIN (to_tsvector('persian', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(excerpt,'')));

CREATE TRIGGER trg_news_updated_at
    BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۵. جدول نظرات اخبار
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE news_comments (
    id BIGSERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL,
    user_id BIGINT,
    guest_name VARCHAR(100),
    guest_email VARCHAR(100),
    content TEXT NOT NULL,
    parent_id INTEGER,
    is_approved BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_comments_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    CONSTRAINT fk_news_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_news_comments_parent FOREIGN KEY (parent_id) REFERENCES news_comments(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_news_comments_news ON news_comments(news_id);
-- CREATE INDEX idx_news_comments_approved ON news_comments(is_approved);
CREATE TRIGGER trg_news_comments_updated_at
    BEFORE UPDATE ON news_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۶. جدول پخش زنده (نسخه گسترش‌یافته)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE live_streams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    description TEXT,
    stream_key VARCHAR(100) UNIQUE,
    stream_url TEXT,
    player_url TEXT,
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    quality VARCHAR(50) DEFAULT 'auto',
    is_recorded BOOLEAN DEFAULT TRUE,
    recording_url TEXT,
    status stream_status_enum DEFAULT 'scheduled',
    visibility stream_visibility_enum DEFAULT 'public',
    allowed_courses JSONB,
    allowed_users JSONB,
    current_viewers INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    chat_messages_count INTEGER DEFAULT 0,
    support_chat_enabled BOOLEAN DEFAULT TRUE,
    questions_enabled BOOLEAN DEFAULT TRUE,
    thumbnail TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_live_streams_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_live_streams_status ON live_streams(status);
-- CREATE INDEX idx_live_streams_scheduled_start ON live_streams(scheduled_start);
-- CREATE INDEX idx_live_streams_stream_key ON live_streams(stream_key);
-- CREATE INDEX idx_live_streams_visibility ON live_streams(visibility);
-- CREATE INDEX idx_live_streams_allowed_users ON live_streams USING GIN (allowed_users);
CREATE TRIGGER trg_live_streams_updated_at
    BEFORE UPDATE ON live_streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۷. جدول چت زنده
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE live_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    stream_id INTEGER NOT NULL,
    user_id BIGINT,
    guest_name VARCHAR(100),
    message TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_question BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_by BIGINT,
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_live_chat_stream FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
    CONSTRAINT fk_live_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_live_chat_answered_by FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_live_chat_stream ON live_chat_messages(stream_id);
-- CREATE INDEX idx_live_chat_created_at ON live_chat_messages(created_at);
-- CREATE INDEX idx_live_chat_question ON live_chat_messages(is_question);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۸. جدول نظرسنجی زنده
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE live_polls (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER NOT NULL,
    question VARCHAR(300) NOT NULL,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    CONSTRAINT fk_live_polls_stream FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_live_polls_stream ON live_polls(stream_id);

CREATE TABLE live_poll_votes (
    id BIGSERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    selected_option INTEGER NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_live_poll_votes_poll FOREIGN KEY (poll_id) REFERENCES live_polls(id) ON DELETE CASCADE,
    CONSTRAINT fk_live_poll_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_live_poll_votes_poll_user UNIQUE (poll_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۱۹. جدول دسته‌بندی درس‌افزارها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE courseware_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon TEXT,
    parent_id INTEGER,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courseware_categories_parent FOREIGN KEY (parent_id) REFERENCES courseware_categories(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_courseware_categories_slug ON courseware_categories(slug);
CREATE TRIGGER trg_courseware_categories_updated_at
    BEFORE UPDATE ON courseware_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۰. جدول درس‌افزارها (نسخه یکپارچه و گسترش‌یافته)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE courseware (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    type courseware_type_enum DEFAULT 'document',
    category_id INTEGER,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    content JSONB,
    file_url TEXT,
    scorm_package_url TEXT,
    thumbnail TEXT,
    interactivity JSONB DEFAULT '{"quizzes": false, "feedback": false, "progress": true}',
    settings JSONB,
    is_free BOOLEAN DEFAULT FALSE,
    access_level courseware_access_enum DEFAULT 'public',
    allowed_courses JSONB,
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    status news_status_enum DEFAULT 'draft', -- استفاده از enum مشابه
    version INTEGER DEFAULT 1,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courseware_category FOREIGN KEY (category_id) REFERENCES courseware_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_courseware_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_courseware_slug ON courseware(slug);
-- CREATE INDEX idx_courseware_type ON courseware(type);
-- CREATE INDEX idx_courseware_status ON courseware(status);
-- CREATE INDEX idx_courseware_allowed_courses ON courseware USING GIN (allowed_courses);
CREATE TRIGGER trg_courseware_updated_at
    BEFORE UPDATE ON courseware FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۱. جدول استفاده از درس‌افزار
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE courseware_usage (
    id BIGSERIAL PRIMARY KEY,
    courseware_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    course_id INTEGER,
    session_id VARCHAR(100),
    interaction_data JSONB,
    time_spent INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courseware_usage_cw FOREIGN KEY (courseware_id) REFERENCES courseware(id) ON DELETE CASCADE,
    CONSTRAINT fk_courseware_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_courseware_usage_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_courseware_usage_courseware ON courseware_usage(courseware_id);
-- CREATE INDEX idx_courseware_usage_user ON courseware_usage(user_id);
-- CREATE INDEX idx_courseware_usage_created_at ON courseware_usage(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۲. جدول کلاس‌های مجازی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE virtual_classes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id BIGINT NOT NULL,
    course_id INTEGER,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB,
    platform class_platform_enum DEFAULT 'internal',
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    join_url TEXT,
    max_participants INTEGER DEFAULT 100,
    recording_enabled BOOLEAN DEFAULT TRUE,
    recording_url TEXT,
    chat_enabled BOOLEAN DEFAULT TRUE,
    raise_hand_enabled BOOLEAN DEFAULT TRUE,
    status class_status_enum DEFAULT 'scheduled',
    participants_count INTEGER DEFAULT 0,
    attendance_count INTEGER DEFAULT 0,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_virtual_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_virtual_classes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_virtual_classes_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_virtual_classes_teacher ON virtual_classes(teacher_id);
-- CREATE INDEX idx_virtual_classes_status ON virtual_classes(status);
-- CREATE INDEX idx_virtual_classes_start_time ON virtual_classes(start_time);
CREATE TRIGGER trg_virtual_classes_updated_at
    BEFORE UPDATE ON virtual_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۳. جدول شرکت‌کنندگان کلاس
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE class_participants (
    id BIGSERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    duration INTEGER DEFAULT 0,
    is_attended BOOLEAN DEFAULT TRUE,
    attendance_percentage DECIMAL(5,2),
    raised_hand_count INTEGER DEFAULT 0,
    chat_messages_count INTEGER DEFAULT 0,
    CONSTRAINT fk_class_participants_class FOREIGN KEY (class_id) REFERENCES virtual_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_class_participants_class_user UNIQUE (class_id, user_id)
);
-- CREATE INDEX idx_class_participants_class ON class_participants(class_id);
-- CREATE INDEX idx_class_participants_user ON class_participants(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۴. جدول حضور و غیاب کلاس مجازی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE class_attendance (
    id BIGSERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status attendance_status_enum DEFAULT 'absent',
    late_minutes INTEGER DEFAULT 0,
    excuse_reason TEXT,
    marked_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_attendance_class FOREIGN KEY (class_id) REFERENCES virtual_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_attendance_marker FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
    /*CONSTRAINT uk_class_attendance_class_user_date UNIQUE (class_id, user_id, DATE_TRUNC('day', check_in_time))*/
);
-- CREATE INDEX idx_class_attendance_class ON class_attendance(class_id);
-- CREATE INDEX idx_class_attendance_status ON class_attendance(status);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۵. جدول منوهای ادمین
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE admin_menus (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    url VARCHAR(200),
    parent_id INTEGER,
    permission VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_menus_parent FOREIGN KEY (parent_id) REFERENCES admin_menus(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_admin_menus_parent ON admin_menus(parent_id);
CREATE TRIGGER trg_admin_menus_updated_at
    BEFORE UPDATE ON admin_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۶. جدول لاگ فعالیت ادمین (نسخه جامع)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE admin_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_admin_logs_admin ON admin_activity_logs(admin_id);
-- CREATE INDEX idx_admin_logs_action ON admin_activity_logs(action);
-- CREATE INDEX idx_admin_logs_entity ON admin_activity_logs(entity_type, entity_id);
-- CREATE INDEX idx_admin_logs_created_at ON admin_activity_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۷. جدول سشن‌های ادمین
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE admin_sessions (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
-- CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);
-- CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۸. جدول بلوک‌های محتوایی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE content_blocks (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200),
    content TEXT,
    content_type content_type_enum DEFAULT 'html',
    settings JSONB,
    status news_status_enum DEFAULT 'published',
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_content_blocks_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_content_blocks_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_content_blocks_key ON content_blocks(key_name);
-- CREATE INDEX idx_content_blocks_status ON content_blocks(status);
CREATE TRIGGER trg_content_blocks_updated_at
    BEFORE UPDATE ON content_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۲۹. جدول کتابخانه رسانه
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE media_library (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_type VARCHAR(20) DEFAULT 'image',
    alt_text VARCHAR(200),
    caption TEXT,
    description TEXT,
    uploaded_by BIGINT,
    source_url TEXT,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_media_file_type ON media_library(file_type);
-- CREATE INDEX idx_media_uploader ON media_library(uploaded_by);
-- CREATE INDEX idx_media_search ON media_library USING GIN (to_tsvector('persian', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۰. جدول اسلایدرها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE sliders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    subtitle VARCHAR(300),
    description TEXT,
    image TEXT NOT NULL,
    mobile_image TEXT,
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    button_color VARCHAR(20),
    button_text_color VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sliders_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_sliders_active ON sliders(is_active);
-- CREATE INDEX idx_sliders_order ON sliders(order_index);
CREATE TRIGGER trg_sliders_updated_at
    BEFORE UPDATE ON sliders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۱. جدول پیام‌های سراسری
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE broadcasts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_type broadcast_target_enum DEFAULT 'all',
    target_roles JSONB,
    target_courses JSONB,
    target_users JSONB,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_notification BOOLEAN DEFAULT TRUE,
    send_telegram BOOLEAN DEFAULT FALSE,
    schedule_at TIMESTAMP,
    sent_at TIMESTAMP,
    expires_at TIMESTAMP,
    status broadcast_status_enum DEFAULT 'draft',
    priority broadcast_priority_enum DEFAULT 'normal',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_broadcasts_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_broadcasts_status ON broadcasts(status);
-- CREATE INDEX idx_broadcasts_schedule ON broadcasts(schedule_at);
-- CREATE INDEX idx_broadcasts_target_users ON broadcasts USING GIN (target_users);
CREATE TRIGGER trg_broadcasts_updated_at
    BEFORE UPDATE ON broadcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۲. جدول لاگ ارسال پیام‌های سراسری
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE broadcast_logs (
    id BIGSERIAL PRIMARY KEY,
    broadcast_id INTEGER NOT NULL,
    recipient_id BIGINT,
    recipient_phone VARCHAR(15),
    recipient_email VARCHAR(100),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_broadcast_logs_broadcast FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
    CONSTRAINT fk_broadcast_logs_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_broadcast_logs_broadcast ON broadcast_logs(broadcast_id);
-- CREATE INDEX idx_broadcast_logs_status ON broadcast_logs(status);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۳. جدول ویجت‌های داشبورد
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE dashboard_widgets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    query_config JSONB,
    chart_config JSONB,
    size VARCHAR(20) DEFAULT 'medium',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    refresh_interval INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_dashboard_widgets_active ON dashboard_widgets(is_active);
CREATE TRIGGER trg_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۴. جدول تنظیمات سایت
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text',
    group_name VARCHAR(50),
    label VARCHAR(200),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_site_settings_key ON site_settings(setting_key);
-- CREATE INDEX idx_site_settings_group ON site_settings(group_name);
CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۵. جدول مکاتبات (اتوماسیون اداری)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE communications (
    id BIGSERIAL PRIMARY KEY,
    letter_number VARCHAR(50) UNIQUE,
    subject VARCHAR(300) NOT NULL,
    content TEXT,
    type communication_type_enum NOT NULL,
    priority broadcast_priority_enum DEFAULT 'normal',
    sender_id BIGINT,
    sender_name VARCHAR(200),
    sender_organization VARCHAR(200),
    recipient_id BIGINT,
    recipient_name VARCHAR(200),
    recipient_organization VARCHAR(200),
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_id BIGINT,
    response_deadline DATE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_communications_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_communications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_communications_parent FOREIGN KEY (parent_id) REFERENCES communications(id) ON DELETE SET NULL,
    CONSTRAINT fk_communications_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_communications_letter_number ON communications(letter_number);
-- CREATE INDEX idx_communications_type ON communications(type);
-- CREATE INDEX idx_communications_status ON communications(status);
-- CREATE INDEX idx_communications_created_at ON communications(created_at);
CREATE TRIGGER trg_communications_updated_at
    BEFORE UPDATE ON communications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۶. جدول دامنه‌های علمی (Roshana Domains)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    name_fa VARCHAR(200),
    category domain_category_enum DEFAULT 'academic',
    access_type domain_access_enum DEFAULT 'whitelist',
    publisher VARCHAR(200),
    country VARCHAR(100),
    language VARCHAR(20),
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 500,
    rate_limit_per_day INTEGER DEFAULT 5000,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    notes TEXT,
    added_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_domains_adder FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_domains_domain ON roshana_domains(domain);
-- CREATE INDEX idx_roshana_domains_access_type ON roshana_domains(access_type);
-- CREATE INDEX idx_roshana_domains_category ON roshana_domains(category);
-- CREATE INDEX idx_roshana_domains_active ON roshana_domains(is_active);
CREATE TRIGGER trg_roshana_domains_updated_at
    BEFORE UPDATE ON roshana_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ═══════════════════════════════════════════════════════════════════════
--                      ماژول روشنا-سی (Roshana-C)
--              مدیریت دسترسی، کش، ناهنجاری و گزارش‌گیری
--                      تبدیل نهایی برای PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════

-- ایجاد ENUM های مورد نیاز
CREATE TYPE path_type_enum AS ENUM ('exact', 'prefix', 'regex', 'wildcard');
CREATE TYPE path_access_enum AS ENUM ('allow', 'deny');
CREATE TYPE policy_type_enum AS ENUM ('time_based', 'volume_based', 'content_based', 'user_based', 'ip_based');
CREATE TYPE policy_action_enum AS ENUM ('allow', 'deny', 'redirect', 'log_only', 'require_approval');
CREATE TYPE assignee_type_enum AS ENUM ('user', 'role', 'department', 'faculty');
CREATE TYPE anomaly_type_enum AS ENUM (
    'high_request_rate',
    'suspicious_url',
    'unusual_hours',
    'bulk_download',
    'ip_rotation',
    'credential_sharing',
    'other'
);
CREATE TYPE anomaly_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE anomaly_status_enum AS ENUM ('pending', 'investigating', 'confirmed', 'false_positive', 'resolved');
CREATE TYPE roshana_report_type_enum AS ENUM ('daily', 'weekly', 'monthly', 'custom', 'anomaly', 'compliance');
CREATE TYPE roshana_report_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۷. جدول زیردامنه‌ها و مسیرهای خاص
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_domain_paths (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL,
    path VARCHAR(500) NOT NULL,
    path_type path_type_enum DEFAULT 'prefix',
    access_type path_access_enum DEFAULT 'allow',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_domain_paths_domain FOREIGN KEY (domain_id) REFERENCES roshana_domains(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_roshana_domain_paths_domain ON roshana_domain_paths(domain_id);
-- CREATE INDEX idx_roshana_domain_paths_path ON roshana_domain_paths(path);
-- CREATE INDEX idx_roshana_domain_paths_active ON roshana_domain_paths(is_active);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۸. جدول سیاست‌های دسترسی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_fa VARCHAR(200),
    description TEXT,
    priority INTEGER DEFAULT 0,
    policy_type policy_type_enum NOT NULL,
    conditions JSONB NOT NULL,
    action policy_action_enum DEFAULT 'allow',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_policies_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_policies_policy_type ON roshana_policies(policy_type);
-- CREATE INDEX idx_roshana_policies_is_active ON roshana_policies(is_active);
-- CREATE INDEX idx_roshana_policies_priority ON roshana_policies(priority);
CREATE TRIGGER trg_roshana_policies_updated_at
    BEFORE UPDATE ON roshana_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۳۹. جدول اختصاص سیاست به کاربران/نقش‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_policy_assignments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL,
    assignee_type assignee_type_enum NOT NULL,
    assignee_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_policy_assignments_policy FOREIGN KEY (policy_id) REFERENCES roshana_policies(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_roshana_policy_assignments_policy ON roshana_policy_assignments(policy_id);
-- CREATE INDEX idx_roshana_policy_assignments_assignee ON roshana_policy_assignments(assignee_type, assignee_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۰. جدول اصلی لاگ دسترسی‌ها
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    session_id VARCHAR(100),
    request_method VARCHAR(10),
    request_url TEXT,
    request_headers JSONB,
    request_body_size INTEGER,
    target_domain VARCHAR(255),
    target_url TEXT,
    target_ip VARCHAR(45),
    response_status INTEGER,
    response_size BIGINT,
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    client_ip VARCHAR(45),
    client_port INTEGER,
    user_agent TEXT,
    referer TEXT,
    applied_policies JSONB,
    action_taken VARCHAR(50),
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason VARCHAR(500),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DECIMAL(5,2),
    anomaly_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_access_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_access_logs_user_id ON roshana_access_logs(user_id);
-- CREATE INDEX idx_roshana_access_logs_session_id ON roshana_access_logs(session_id);
-- CREATE INDEX idx_roshana_access_logs_target_domain ON roshana_access_logs(target_domain);
-- CREATE INDEX idx_roshana_access_logs_created_at ON roshana_access_logs(created_at);
-- CREATE INDEX idx_roshana_access_logs_is_blocked ON roshana_access_logs(is_blocked);
-- CREATE INDEX idx_roshana_access_logs_is_anomaly ON roshana_access_logs(is_anomaly);
-- CREATE INDEX idx_roshana_access_logs_response_status ON roshana_access_logs(response_status);
-- CREATE INDEX idx_roshana_access_logs_client_ip ON roshana_access_logs(client_ip);
-- جستجوی تمام متن
-- CREATE INDEX idx_roshana_access_logs_search ON roshana_access_logs USING GIN (to_tsvector('english', coalesce(request_url,'') || ' ' || coalesce(target_url,'')));

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۱. جدول آمار روزانه
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_daily_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_bytes_transferred BIGINT DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_domains INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    blocked_requests INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    top_domains JSONB,
    top_users JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_roshana_daily_stats_date UNIQUE (stat_date)
);
-- CREATE INDEX idx_roshana_daily_stats_stat_date ON roshana_daily_stats(stat_date);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۲. جدول محتوای کش شده
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_cache_items (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(500) NOT NULL UNIQUE,
    url VARCHAR(2000) NOT NULL,
    content BYTEA,  -- جایگزین LONGBLOB
    content_type VARCHAR(100),
    content_encoding VARCHAR(50),
    content_size BIGINT,
    headers JSONB,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_roshana_cache_items_cache_key ON roshana_cache_items(cache_key);
-- CREATE INDEX idx_roshana_cache_items_expires_at ON roshana_cache_items(expires_at);
-- CREATE INDEX idx_roshana_cache_items_url ON roshana_cache_items(url);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۳. جدول رویدادهای ناهنجار
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_anomalies (
    id BIGSERIAL PRIMARY KEY,
    anomaly_type anomaly_type_enum NOT NULL,
    severity anomaly_severity_enum DEFAULT 'medium',
    user_id BIGINT,
    session_id VARCHAR(100),
    client_ip VARCHAR(45),
    description TEXT,
    details JSONB,
    anomaly_score DECIMAL(5,2),
    status anomaly_status_enum DEFAULT 'pending',
    action_taken VARCHAR(200),
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_anomalies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_roshana_anomalies_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_anomalies_user_id ON roshana_anomalies(user_id);
-- CREATE INDEX idx_roshana_anomalies_anomaly_type ON roshana_anomalies(anomaly_type);
-- CREATE INDEX idx_roshana_anomalies_severity ON roshana_anomalies(severity);
-- CREATE INDEX idx_roshana_anomalies_status ON roshana_anomalies(status);
-- CREATE INDEX idx_roshana_anomalies_created_at ON roshana_anomalies(created_at);
CREATE TRIGGER trg_roshana_anomalies_updated_at
    BEFORE UPDATE ON roshana_anomalies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۴. جدول گزارش‌های روشنا-سی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_reports (
    id SERIAL PRIMARY KEY,
    report_type roshana_report_type_enum NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    date_range_start DATE,
    date_range_end DATE,
    filters JSONB,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    summary JSONB,
    status roshana_report_status_enum DEFAULT 'pending',
    requested_by BIGINT,
    generated_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_reports_requestor FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_reports_report_type ON roshana_reports(report_type);
-- CREATE INDEX idx_roshana_reports_status ON roshana_reports(status);
-- CREATE INDEX idx_roshana_reports_created_at ON roshana_reports(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۵. جدول تنظیمات روشنا-سی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text',
    category VARCHAR(50),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roshana_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_settings_key ON roshana_settings(setting_key);
-- CREATE INDEX idx_roshana_settings_category ON roshana_settings(category);
CREATE TRIGGER trg_roshana_settings_updated_at
    BEFORE UPDATE ON roshana_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- درج تنظیمات پیش‌فرض روشنا-سی
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO roshana_settings (setting_key, setting_value, setting_type, category, description) VALUES
('rate_limit_default_per_minute', '60', 'number', 'rate_limits', 'محدودیت پیش‌فرض درخواست در دقیقه'),
('rate_limit_default_per_hour', '500', 'number', 'rate_limits', 'محدودیت پیش‌فرض درخواست در ساعت'),
('rate_limit_default_per_day', '5000', 'number', 'rate_limits', 'محدودیت پیش‌فرض درخواست در روز'),
('cache_ttl_default', '3600', 'number', 'cache', 'زمان کش پیش‌فرض (ثانیه)'),
('cache_max_size_mb', '1024', 'number', 'cache', 'حداکثر حجم کش (مگابایت)'),
('anomaly_detection_enabled', 'true', 'boolean', 'anomaly', 'فعال/غیرفعال بودن تشخیص ناهنجاری'),
('anomaly_request_threshold', '100', 'number', 'anomaly', 'آستانه درخواست برای تشخیص ناهنجاری'),
('anomaly_time_window_minutes', '5', 'number', 'anomaly', 'پنجره زمانی تشخیص ناهنجاری (دقیقه)'),
('logging_level', 'info', 'text', 'logging', 'سطح لاگ‌گیری (debug, info, warn, error)'),
('logging_retention_days', '90', 'number', 'logging', 'مدت نگهداری لاگ‌ها (روز)');

-- ═══════════════════════════════════════════════════════════════════════
-- ۲۴۶. جدول نشست‌های فعال روشنا-سی
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE roshana_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    token_type VARCHAR(50) DEFAULT 'Bearer',
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    rate_limit_remaining INTEGER DEFAULT 0,
    bandwidth_used BIGINT DEFAULT 0,
    bandwidth_limit BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    terminated_by BIGINT,
    terminated_reason VARCHAR(200),
    CONSTRAINT fk_roshana_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_roshana_sessions_terminator FOREIGN KEY (terminated_by) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_roshana_sessions_user_id ON roshana_sessions(user_id);
-- CREATE INDEX idx_roshana_sessions_access_token ON roshana_sessions(access_token);
-- CREATE INDEX idx_roshana_sessions_expires_at ON roshana_sessions(expires_at);
-- CREATE INDEX idx_roshana_sessions_is_active ON roshana_sessions(is_active);

-- ═══════════════════════════════════════════════════════════════════════
--          ماژول‌های فوق‌پیشرفته (Next-Level Modules)
--          طراحی برای مقیاس‌پذیری و هوشمندسازی کامل
-- ═══════════════════════════════════════════════════════════════════════

-- =========================================================================
--  ماژول ۱: پذیرش هوشمند و سنجش تطبیقی (Smart Admission & Adaptive Testing)
-- =========================================================================
CREATE TYPE applicant_status_enum AS ENUM ('prospect', 'applied', 'shortlisted', 'interviewed', 'offered', 'enrolled', 'declined', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'converted');
CREATE TYPE exam_type_enum AS ENUM ('national', 'internal', 'adaptive', 'coding_challenge', 'practical');

-- جدول داوطلبان ورودی (با قابلیت تبدیل خودکار به Student)
-- =============================================
-- ایجاد نوع‌های ENUM مورد نیاز (در صورت نبود)
-- =============================================
-- =============================================
-- جدول متقاضیان پذیرش (بدون وابستگی به pgvector)
-- =============================================
CREATE TABLE admission_applicants (
    id BIGSERIAL PRIMARY KEY,
    national_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    father_name VARCHAR(50),
    birth_date DATE,
    gender gender_enum,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    education_level VARCHAR(50),
    high_school_gpa DECIMAL(4,2),
    previous_university VARCHAR(100),
    
    -- پروفایل روانشناختی و شخصیتی (هوش مصنوعی مولد)
    personality_traits JSONB, -- مدل Big Five: {openness: 0.8, conscientiousness: 0.7...}
    learning_style VARCHAR(50), -- Visual, Auditory, Kinesthetic
    behavioral_vector REAL[],   -- بردار امبدینگ رفتار داوطلب (آرایه 128 عضوی از REAL، بدون نیاز به pgvector)
    
    status applicant_status_enum DEFAULT 'applied',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_advisor BIGINT, -- کارشناس پذیرش
    
    -- تبدیل به دانشجو
    converted_student_id BIGINT,
    converted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_applicants_advisor FOREIGN KEY (assigned_advisor) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_applicants_student FOREIGN KEY (converted_student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- تریگر به‌روزرسانی updated_at (در صورت نیاز)
CREATE TRIGGER trg_admission_applicants_updated_at
    BEFORE UPDATE ON admission_applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- CREATE INDEX idx_applicants_national_code ON admission_applicants(national_code);
-- CREATE INDEX idx_applicants_status ON admission_applicants(status);
-- CREATE INDEX idx_applicants_behavioral_vector ON admission_applicants USING ivfflat (behavioral_vector vector_cosine_ops);

-- جدول آزمون‌های تطبیقی (Adaptive Testing)
CREATE TABLE admission_exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    exam_type exam_type_enum NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    
    -- سوالات مبتنی بر IRT (Item Response Theory)
    question_bank_ids JSONB,
    adaptive_logic JSONB, -- تنظیمات الگوریتم تطبیق‌پذیری
    passing_threshold DECIMAL(5,2),
    
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admission_exams_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- جدول نتایج آزمون‌های ورودی
CREATE TABLE admission_results (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    exam_id INTEGER NOT NULL,
    score DECIMAL(6,2),
    percentile_rank DECIMAL(5,2),
    detailed_metrics JSONB, -- نمره هر مهارت (Reading, Math, Logic)
    ai_proctoring_score DECIMAL(5,2), -- امتیاز تقلب (نظارت تصویری هوش مصنوعی)
    is_passed BOOLEAN DEFAULT FALSE,
    attended_at TIMESTAMP,
    
    CONSTRAINT fk_admission_results_applicant FOREIGN KEY (applicant_id) REFERENCES admission_applicants(id) ON DELETE CASCADE,
    CONSTRAINT fk_admission_results_exam FOREIGN KEY (exam_id) REFERENCES admission_exams(id) ON DELETE CASCADE,
    CONSTRAINT uk_admission_results_applicant_exam UNIQUE (applicant_id, exam_id)
);
-- CREATE INDEX idx_admission_results_score ON admission_results(score DESC);

-- =========================================================================
--  ماژول ۲: هوش تجاری و تحلیل پیش‌بینی (Predictive Analytics & LLM Insights)
-- =========================================================================
-- CREATE EXTENSION IF NOT EXISTS vector; -- فعال‌سازی pgvector برای جستجوی برداری

-- جدول مدل‌های یادگیری ماشین
CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50), -- regression, classification, llm, embedding
    version VARCHAR(20),
    file_path TEXT, -- مسیر فایل Pickle یا ONNX
    metrics JSONB, -- {accuracy: 0.95, f1_score: 0.89}
    is_active BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول ریسک افت تحصیلی دانشجو (Churn Prediction)
CREATE TABLE student_risk_assessments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    term_id INTEGER,
    model_id INTEGER,
    risk_score DECIMAL(5,2), -- 0 to 100
    risk_factors JSONB, -- دلایل: ['low_attendance', 'failed_prerequisite']
    recommended_actions JSONB, -- اقدامات پیشنهادی: ['meet_advisor', 'extra_class']
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by BIGINT,
    CONSTRAINT fk_risk_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_risk_model FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_risk_student_term ON student_risk_assessments(student_id, term_id);

-- جدول پیشنهادات شخصی‌سازی‌شده (Recommendation Engine)
CREATE TABLE personalized_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entity_type VARCHAR(50), -- course, news, book, event, research_paper
    entity_id BIGINT NOT NULL,
    score DECIMAL(5,4), -- امتیاز مرتبط بودن
    reason TEXT, -- توضیح قابل نمایش: "چون درس X را دوست داشتی"
    is_clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_recommendations_user ON personalized_recommendations(user_id, entity_type);

-- =========================================================================
--  ماژول ۳: اینترنت اشیاء و دوقلوی دیجیتال (IoT & Digital Twin)
-- =========================================================================
CREATE TYPE device_status_enum AS ENUM ('online', 'offline', 'maintenance', 'error');

-- جدول دستگاه‌های هوشمند
/* CREATE TABLE iot_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50), -- camera, beacon, air_quality, smart_lock, energy_meter
    location GEOGRAPHY(POINT), -- مختصات جغرافیایی دقیق
    building VARCHAR(50),
    floor INTEGER,
    room VARCHAR(20),
    ip_address INET,
    last_seen TIMESTAMP,
    status device_status_enum DEFAULT 'offline',
    metadata JSONB,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); */
-- ایجاد نوع Enum برای وضعیت دستگاه (در صورت نیاز)

-- جدول دستگاه‌های IoT (بدون وابستگی به PostGIS)
CREATE TABLE iot_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50), -- camera, beacon, air_quality, smart_lock, energy_meter
    
    -- جایگزین GEOGRAPHY(POINT) با استفاده از نوع POINT داخلی PostgreSQL
    location POINT, -- مختصات جغرافیایی ساده (x,y) - معادل طول و عرض
    
    -- یا اگر نیاز به ذخیره جداگانه دارید:
    -- latitude DECIMAL(10,8),
    -- longitude DECIMAL(11,8),
    
    building VARCHAR(50),
    floor INTEGER,
    room VARCHAR(20),
    ip_address INET,
    last_seen TIMESTAMP,
    status device_status_enum DEFAULT 'offline',
    metadata JSONB,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- تریگر به‌روزرسانی updated_at (اختیاری، در صورت وجود تابع)
-- CREATE TRIGGER trg_iot_devices_updated_at
--     BEFORE UPDATE ON iot_devices
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();
-- CREATE INDEX idx_iot_devices_location ON iot_devices USING GIST (location);

-- جدول خوانش سنسورها (Data Lake)
CREATE TABLE iot_sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(50), -- temperature, humidity, co2, occupancy, power_watts
    value DOUBLE PRECISION,
    unit VARCHAR(10),
    CONSTRAINT fk_iot_readings_device FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);

-- ایندکس ترکیبی برای جستجوهای پرکاربرد بر اساس دستگاه و زمان
-- CREATE INDEX idx_iot_readings_device_time ON iot_sensor_readings(device_id, timestamp);

-- ایندکس مستقل روی timestamp برای پرس‌وجوهای کلی زمانی
-- CREATE INDEX idx_iot_readings_time ON iot_sensor_readings(timestamp);
-- CREATE INDEX idx_iot_readings_device_time ON iot_sensor_readings(device_id, timestamp DESC);

-- جدول لاگ تشخیص چهره (Face Recognition)
CREATE TABLE face_recognition_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    detected_user_id BIGINT,
    confidence_score DECIMAL(5,2),
    image_snapshot_path TEXT,
    access_granted BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_face_log_device FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_face_log_user FOREIGN KEY (detected_user_id) REFERENCES users(id) ON DELETE SET NULL
);
-- CREATE INDEX idx_face_log_user_time ON face_recognition_logs(detected_user_id, timestamp DESC);

-- =========================================================================
--  ماژول ۴: مدیریت پژوهش و نوآوری پیشرفته (Grants, Patents & Peer Review)
-- =========================================================================
-- جدول گرنت‌های تحقیقاتی
CREATE TABLE research_grants (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    funding_organization VARCHAR(200),
    total_budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    principal_investigator_id BIGINT,
    team_members JSONB,
    status VARCHAR(30) DEFAULT 'proposal',
    approved_at TIMESTAMP,
    CONSTRAINT fk_grant_pi FOREIGN KEY (principal_investigator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- جدول ثبت اختراعات (Patents)
CREATE TABLE patents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    inventors JSONB NOT NULL,
    patent_number VARCHAR(100) UNIQUE,
    filing_date DATE,
    publication_date DATE,
    grant_date DATE,
    status VARCHAR(30), -- pending, granted, rejected
    patent_office VARCHAR(50), -- USPTO, EPO, IRIPO
    abstract TEXT,
    claims TEXT,
    file_url TEXT,
    created_by BIGINT,
    CONSTRAINT fk_patent_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- جدول داوری همتا (Peer Review Management)
CREATE TABLE peer_reviews (
    id BIGSERIAL PRIMARY KEY,
    reviewable_type VARCHAR(50), -- paper, thesis, proposal
    reviewable_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    round INTEGER DEFAULT 1,
    invitation_sent_at TIMESTAMP,
    response_status VARCHAR(20) DEFAULT 'pending', -- accepted, declined
    completed_at TIMESTAMP,
    recommendation VARCHAR(30), -- accept, minor_revision, major_revision, reject
    comments JSONB, -- ساختار یافته
    private_notes TEXT,
    score INTEGER,
    CONSTRAINT fk_peer_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_peer_reviews_reviewable ON peer_reviews(reviewable_type, reviewable_id);

-- =========================================================================
--  ماژول ۵: گیمیفیکیشن و اقتصاد رفتاری (Engagement Economy)
-- =========================================================================
-- جدول کیف پول امتیازی کاربران
CREATE TABLE user_wallets (
    user_id BIGINT PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول تراکنش‌های امتیازی
CREATE TABLE point_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(30), -- earn, spend, expire, gift, admin_adjust
    reason VARCHAR(100),
    reference_type VARCHAR(50),
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_point_txn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول چالش‌های روزانه/هفتگی
CREATE TABLE gamification_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(30), -- daily_login, course_streak, comment_quality, paper_read
    target_value INTEGER,
    reward_points INTEGER NOT NULL,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول فروشگاه جوایز
CREATE TABLE reward_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image TEXT,
    cost_points INTEGER NOT NULL,
    quantity_available INTEGER DEFAULT -1, -- -1 = نامحدود
    redemption_limit_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(50)
);

-- جدول درخواست‌های بازخرید
CREATE TABLE reward_redemptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id INTEGER NOT NULL,
    points_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, fulfilled, cancelled
    redemption_code VARCHAR(100) UNIQUE,
    notes TEXT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP,
    CONSTRAINT fk_redemption_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_redemption_item FOREIGN KEY (item_id) REFERENCES reward_items(id) ON DELETE RESTRICT
);

-- =========================================================================
--  ماژول ۶: سلامت روان و رفاه پیشرفته (Advanced Wellness)
-- =========================================================================
-- جدول پایش سلامت روان (Mental Health)
CREATE TABLE mental_health_checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    survey_type VARCHAR(20), -- PHQ-9, GAD-7, PSS
    responses JSONB,
    score INTEGER, -- نمره استاندارد
    severity_level VARCHAR(20), -- mild, moderate, severe
    is_flagged BOOLEAN DEFAULT FALSE, -- نیاز به مداخله فوری
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mental_health_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_mental_health_user_flag ON mental_health_checkins(user_id, is_flagged);

-- جدول رژیم‌های غذایی و آلرژی
CREATE TABLE user_dietary_profiles (
    user_id BIGINT PRIMARY KEY,
    allergies JSONB,
    dietary_restrictions JSONB, -- ['vegan', 'halal', 'gluten_free']
    medical_conditions JSONB,
    calorie_target INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================================
--  ماژول ۷: موتور قوانین و اتوماسیون (Rule Engine & Workflow)
-- =========================================================================
CREATE TABLE automation_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(100) NOT NULL, -- 'student.grade.updated', 'attendance.low', 'iot.sensor.alert'
    conditions JSONB, -- { "field": "grade", "operator": "<", "value": 10 }
    actions JSONB, -- [{"type": "send_sms", "template": "risk_alert", "target": "advisor"}]
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP,
    created_by BIGINT,
    CONSTRAINT fk_rule_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE automation_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL,
    triggered_by_event_id VARCHAR(200),
    status VARCHAR(20) DEFAULT 'success', -- success, failed, skipped
    executed_actions JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_execution_log_rule FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

-- =========================================================================
--  ماژول‌های اختصاصی وزارت علوم (Higher Education Extension)
-- =========================================================================

-- جدول آیین‌نامه ترفیع اعضای هیئت علمی (Promotion Regulation)
CREATE TABLE faculty_promotion_records (
    id SERIAL PRIMARY KEY,
    professor_id BIGINT NOT NULL,
    academic_rank_before VARCHAR(50), -- مربی، استادیار، دانشیار
    academic_rank_after VARCHAR(50),
    promotion_date DATE,
    
    -- امتیازات آیین‌نامه (ماده ۱ تا ۴)
    cultural_score INTEGER DEFAULT 0,
    educational_score INTEGER DEFAULT 0,
    research_score INTEGER DEFAULT 0,
    executive_score INTEGER DEFAULT 0,
    total_score INTEGER,
    
    -- مستندات
    dossier_url TEXT,
    committee_decision JSONB,
    status VARCHAR(30) DEFAULT 'under_review', -- approved, rejected, appealed
    approved_by BIGINT,
    approved_at TIMESTAMP,
    
    CONSTRAINT fk_promotion_prof FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_promotion_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE faculty_promotion_records IS 'سوابق ارتقاء اعضای هیئت علمی بر اساس آیین‌نامه وزارت علوم';

-- جدول فرصت‌های مطالعاتی (Sabbatical Leaves)
CREATE TABLE sabbatical_leaves (
    id SERIAL PRIMARY KEY,
    professor_id BIGINT NOT NULL,
    destination_country VARCHAR(100),
    host_university VARCHAR(200),
    research_title VARCHAR(500),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grant_amount DECIMAL(15,2),
    report_submitted BOOLEAN DEFAULT FALSE,
    report_file TEXT,
    status VARCHAR(30) DEFAULT 'planned',
    CONSTRAINT fk_sabbatical_prof FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE sabbatical_leaves IS 'مدیریت فرصت‌های مطالعاتی اعضای هیئت علمی';

-- جدول طرح‌های کلان ملی (National Research Projects)
CREATE TABLE national_research_projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    lead_university_id INTEGER,
    collaborating_universities JSONB,
    total_budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'proposal', -- approved, ongoing, completed
    supervisor_id BIGINT,
    CONSTRAINT fk_national_project_lead FOREIGN KEY (lead_university_id) REFERENCES organizational_structure(id) ON DELETE SET NULL,
    CONSTRAINT fk_national_project_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE national_research_projects IS 'مدیریت طرح‌های تحقیقاتی مشترک بین دانشگاهی';

-- =========================================================================
--  ماژول‌های اختصاصی آموزش و پرورش (K-12 Extension)
-- =========================================================================

-- جدول مدارس (Schools) به جای دانشگاه
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    school_type VARCHAR(30), -- دولتی، هیئت امنایی، غیرانتفاعی، تیزهوشان، شاهد
    gender VARCHAR(10), -- پسرانه، دخترانه، مختلط
    grade_levels JSONB, -- ['elementary', 'middle', 'high']
    region_code VARCHAR(20), -- کد منطقه آموزش و پرورش
    principal_id BIGINT,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_school_principal FOREIGN KEY (principal_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE schools IS 'اطلاعات پایه مدارس تحت پوشش';

-- جدول دانش‌آموزان (Pupils) به جای Students
CREATE TABLE pupils (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE,
    student_national_id VARCHAR(20) UNIQUE NOT NULL, -- کد ملی (شناسه اصلی)
    school_id INTEGER NOT NULL,
    grade_level INTEGER NOT NULL, -- پایه تحصیلی (۱ تا ۱۲)
    class_name VARCHAR(20), -- نام کلاس (مثلاً ۳/۱)
    field_of_study VARCHAR(50), -- رشته (ریاضی، تجربی، انسانی - فقط متوسطه دوم)
    
    -- اطلاعات والدین (ضروری برای K-12)
    father_name VARCHAR(50),
    father_phone VARCHAR(20),
    father_job VARCHAR(100),
    mother_name VARCHAR(50),
    mother_phone VARCHAR(20),
    mother_job VARCHAR(100),
    
    enrollment_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    
    CONSTRAINT fk_pupil_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pupil_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
-- CREATE INDEX idx_pupils_school_grade ON pupils(school_id, grade_level);
COMMENT ON TABLE pupils IS 'پروفایل اختصاصی دانش‌آموزان با اطلاعات والدین';

-- جدول معلمان (Teachers) به جای Professors
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    school_id INTEGER NOT NULL,
    teaching_subjects JSONB, -- ['ریاضی', 'فیزیک']
    homeroom_class VARCHAR(20), -- کلاس مدیریتی (مخصوص دوره ابتدایی)
    years_of_experience INTEGER,
    education_degree VARCHAR(50),
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
COMMENT ON TABLE teachers IS 'پروفایل معلمان و کادر آموزشی مدرسه';

-- جدول نمرات و ارزشیابی کیفی-توصیفی (مخصوص ابتدایی)
CREATE TABLE pupil_grades (
    id BIGSERIAL PRIMARY KEY,
    pupil_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    term_id INTEGER NOT NULL,
    
    -- نمرات عددی (متوسطه)
    score DECIMAL(5,2),
    
    -- ارزشیابی توصیفی (ابتدایی)
    descriptive_grade VARCHAR(20), -- خیلی خوب، خوب، قابل قبول، نیاز به تلاش
    
    -- مهارت‌های غیردرسی (مخصوص آموزش و پرورش)
    social_skills VARCHAR(20), -- خیلی خوب، خوب...
    physical_education VARCHAR(20),
    arts VARCHAR(20),
    
    teacher_comment TEXT,
    recorded_by BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pupil_grade_pupil FOREIGN KEY (pupil_id) REFERENCES pupils(id) ON DELETE CASCADE,
    CONSTRAINT fk_pupil_grade_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_pupil_course_term UNIQUE (pupil_id, course_id, term_id)
);
COMMENT ON TABLE pupil_grades IS 'کارنامه دانش‌آموزی با پشتیبانی از ارزشیابی توصیفی ابتدایی';

-- جدول انضباطی و تشویقی (Discipline & Encouragement)
CREATE TABLE pupil_behavior_logs (
    id BIGSERIAL PRIMARY KEY,
    pupil_id INTEGER NOT NULL,
    log_type VARCHAR(20), -- positive, negative
    category VARCHAR(50), -- انضباطی، مالی، اخلاقی، علمی
    description TEXT,
    points INTEGER DEFAULT 0, -- امتیاز مثبت یا منفی
    issued_by BIGINT,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_behavior_pupil FOREIGN KEY (pupil_id) REFERENCES pupils(id) ON DELETE CASCADE
);
COMMENT ON TABLE pupil_behavior_logs IS 'دفتر انضباطی و تشویقی دانش‌آموزان';

-- =========================================================================
--  لایه مدیریت متمرکز وزارتخانه (Federation Layer)
-- =========================================================================

CREATE TABLE federated_organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    organization_type VARCHAR(30), -- university, school, research_center
    local_database_connection_string TEXT , -- اتصال امن به دیتابیس محلی
    sync_endpoint TEXT, -- API Endpoint برای همگام‌سازی
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);
COMMENT ON TABLE federated_organizations IS 'ثبت سازمان‌های تحت پوشش وزارتخانه (دانشگاه/مدرسه)';

-- حذف یا کامنت کردن جداول موقتی که مشکل ایجاد می‌کنند
-- CREATE TABLE IF NOT EXISTS universities ... (این خطوط را کامنت کنید)

-- ایجاد Materialized View خالی با ساختار درست و بدون نیاز به هیچ جدولی
CREATE MATERIALIZED VIEW national_education_statistics AS
SELECT 
    'university'::text AS entity_type,
    0::bigint AS id,
    ''::text AS name,
    0::bigint AS student_count,
    0::numeric AS avg_gpa
WHERE FALSE
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW national_education_statistics IS 'نمای متمرکز وزارت علوم از آمار کل کشور (الگوی خالی - بعداً پر می‌شود)';