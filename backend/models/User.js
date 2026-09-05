// ============================================
// 📦 وارد کردن ماژول‌های مورد نیاز
// ============================================
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// ============================================
// 🗄️ تنظیمات اتصال به PostgreSQL
// ============================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fartak_university',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '@Roko4766300',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// تست اتصال
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ خطا در اتصال به PostgreSQL:', err.stack);
  } else {
    console.log('✅ اتصال به PostgreSQL با موفقیت برقرار شد');
    release();
  }
});

// ============================================
// 🛠️ ابزارهای کمکی
// ============================================

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDuration = (ms) => {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const isValidIdentifier = (name) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

const queryHistory = [];
const MAX_HISTORY = 500;
const addToHistory = (sql, type, duration, result) => {
  queryHistory.unshift({
    sql: sql.substring(0, 500),
    type,
    duration,
    rows: result?.rowCount || result?.length || 0,
    timestamp: new Date().toISOString()
  });
  if (queryHistory.length > MAX_HISTORY) queryHistory.pop();
};

// ============================================
// 🎯 کلاس User - نسخه PostgreSQL
// ============================================
class User {
  
  // ========================================
  // 🔍 جستجو و یافتن کاربران
  // ========================================

  static async findByPhone(phone) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE phone = $1 AND "isActive" = true',
        [phone]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با موبایل:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByUsername(username) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1 AND "isActive" = true',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با نام کاربری:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1 AND "isActive" = true',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با ایمیل:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1 AND "isActive" = true',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با شناسه:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByNationalCode(nationalCode) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE "nationalCode" = $1 AND "isActive" = true',
        [nationalCode]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با کد ملی:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByStudentNumber(studentNumber) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.* FROM users u 
        JOIN students s ON u.id = s."userId" 
        WHERE s."studentNumber" = $1 AND u."isActive" = true
      `, [studentNumber]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با شماره دانشجویی:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByEmployeeNumber(employeeNumber) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT DISTINCT u.* FROM users u 
        LEFT JOIN professors p ON u.id = p."userId" 
        LEFT JOIN staff s ON u.id = s."userId" 
        WHERE p."employeeNumber" = $1 OR s."employeeNumber" = $1
          AND u."isActive" = true
      `, [employeeNumber]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با شماره پرسنلی:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByToken(token) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s."userId"
        WHERE s.token = $1 AND s."isActive" = true AND s."expiresAt" > NOW()
      `, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ خطا در یافتن کاربر با توکن:', error.message);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByRole(role, limit = 100) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, username, email, phone, "firstName", "lastName", role, "profilePhoto" 
         FROM users WHERE role = $1 AND "isActive" = true LIMIT $2`,
        [role, limit]
      );
      return { success: true, users: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, users: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async findByStaffNumber(staffNumber) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.* FROM users u
        JOIN staff s ON u.id = s."userId"
        WHERE s."employeeNumber" = $1 AND u."isActive" = true
      `, [staffNumber]);
      return result.rows[0] || null;
    } catch (error) {
      return null;
    } finally {
      client.release();
    }
  }

  static async getAllUserRoles(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT r.*, ur."assignedAt", ur."expiresAt", ur."isActive" 
        FROM roles r
        JOIN user_roles ur ON r.id = ur."roleId"
        WHERE ur."userId" = $1 AND ur."isActive" = true
      `, [userId]);
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  static async hasPermission(userId, permissionName) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT COUNT(*) as "hasPermission" FROM permissions p
        JOIN role_permissions rp ON p.id = rp."permissionId"
        JOIN user_roles ur ON rp."roleId" = ur."roleId"
        WHERE ur."userId" = $1 AND p.name = $2 AND ur."isActive" = true
      `, [userId, permissionName]);
      return parseInt(result.rows[0].hasPermission) > 0;
    } catch (error) {
      return false;
    } finally {
      client.release();
    }
  }

  static async getUserPermissions(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT DISTINCT p.name, p."nameFa", p.module 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp."permissionId"
        JOIN user_roles ur ON rp."roleId" = ur."roleId"
        WHERE ur."userId" = $1 AND ur."isActive" = true
      `, [userId]);
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🔐 احراز هویت و لاگین
  // ========================================

  static async login(login, password, ipAddress = null, userAgent = null) {
    const startTime = Date.now();
    console.log('🔍 [Login] جستجوی کاربر:', login);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let user = await this.findByPhone(login) || 
                 await this.findByUsername(login) || 
                 await this.findByEmail(login);
      
      if (!user) {
        await this.logLoginAttempt(null, login, ipAddress, userAgent, false, 'user_not_found');
        await client.query('COMMIT');
        return { success: false, message: 'کاربر یافت نشد', code: 'USER_NOT_FOUND' };
      }
      
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const remaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
        await this.logLoginAttempt(user.id, login, ipAddress, userAgent, false, 'account_locked');
        await client.query('COMMIT');
        return { success: false, message: `حساب کاربری قفل شده است. ${remaining} دقیقه دیگر تلاش کنید`, code: 'ACCOUNT_LOCKED' };
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const failed = (user.failedLoginAttempts || 0) + 1;
        const lockedUntil = failed >= 5 ? new Date(Date.now() + 5 * 60000) : null;
        
        await client.query(
          `UPDATE users SET "failedLoginAttempts" = $1, "lockedUntil" = $2 WHERE id = $3`,
          [failed, lockedUntil, user.id]
        );
        
        await this.logLoginAttempt(user.id, login, ipAddress, userAgent, false, 'wrong_password');
        await client.query('COMMIT');
        
        return { success: false, message: `رمز عبور اشتباه است. ${5 - failed} تلاش دیگر باقی مانده`, code: 'INVALID_PASSWORD' };
      }
      
      await client.query(`
        UPDATE users SET 
          "lastLogin" = NOW(), 
          "lastLoginIP" = $1, 
          "loginCount" = "loginCount" + 1, 
          "failedLoginAttempts" = 0, 
          "lockedUntil" = NULL 
        WHERE id = $2
      `, [ipAddress, user.id]);
      
      await this.logLoginAttempt(user.id, login, ipAddress, userAgent, true, 'success');
      await client.query('COMMIT');
      
      delete user.password;
      delete user.twoFactorSecret;
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ ورود موفق: ${user.username} (${responseTime}ms)`);
      
      return { success: true, message: 'ورود موفق', user, responseTime };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در ورود:', error.message);
      await this.logLoginAttempt(null, login, ipAddress, userAgent, false, 'server_error');
      return { success: false, message: 'خطا در ورود', code: 'SERVER_ERROR' };
    } finally {
      client.release();
    }
  }

  static async logLoginAttempt(userId, username, ipAddress, userAgent, success, failureReason = null) {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO login_logs ("userId", username, "ipAddress", "userAgent", success, "failureReason", "loggedInAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [userId, username, ipAddress, userAgent, success, failureReason]);
    } catch (error) {
      console.error('Error logging login attempt:', error.message);
    } finally {
      client.release();
    }
  }

  static async createSession(userId, token, refreshToken, ipAddress, userAgent, expiresInHours = 24) {
    const client = await pool.connect();
    try {
      const expiresAt = new Date(Date.now() + expiresInHours * 3600000);
      await client.query(`
        INSERT INTO sessions ("userId", token, "refreshToken", "ipAddress", "userAgent", "expiresAt", "isActive")
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [userId, token, refreshToken, ipAddress, userAgent, expiresAt]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  static async invalidateSession(token) {
    const client = await pool.connect();
    try {
      await client.query(`UPDATE sessions SET "isActive" = false WHERE token = $1`, [token]);
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async invalidateAllSessions(userId) {
    const client = await pool.connect();
    try {
      await client.query(`UPDATE sessions SET "isActive" = false WHERE "userId" = $1`, [userId]);
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  // ========================================
  // ➕ ثبت نام و ایجاد کاربر
  // ========================================

  static validate(userData) {
    const errors = [];
    const warnings = [];
    
    if (!userData.phone || !/^09\d{9}$/.test(userData.phone)) {
      errors.push('شماره موبایل معتبر نیست (مثال: 09123456789)');
    }
    if (!userData.username || userData.username.length < 3) {
      errors.push('نام کاربری باید حداقل ۳ کاراکتر باشد');
    }
    if (!userData.password || userData.password.length < 6) {
      errors.push('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('ایمیل معتبر نیست');
    }
    if (userData.nationalCode && !this.validateNationalCode(userData.nationalCode)) {
      errors.push('کد ملی معتبر نیست');
    }
    if (!userData.firstName || userData.firstName.length < 2) {
      errors.push('نام باید حداقل ۲ کاراکتر باشد');
    }
    if (!userData.lastName || userData.lastName.length < 2) {
      errors.push('نام خانوادگی باید حداقل ۲ کاراکتر باشد');
    }
    if (userData.gender && !['male', 'female', 'other'].includes(userData.gender)) {
      errors.push('جنسیت معتبر نیست');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  static async checkDuplicate(userData) {
    const duplicates = [];
    
    if (userData.phone && await this.findByPhone(userData.phone)) {
      duplicates.push('شماره موبایل قبلاً ثبت شده است');
    }
    if (userData.username && await this.findByUsername(userData.username)) {
      duplicates.push('نام کاربری قبلاً ثبت شده است');
    }
    if (userData.email && await this.findByEmail(userData.email)) {
      duplicates.push('ایمیل قبلاً ثبت شده است');
    }
    if (userData.nationalCode && await this.findByNationalCode(userData.nationalCode)) {
      duplicates.push('کد ملی قبلاً ثبت شده است');
    }
    
    return { isUnique: duplicates.length === 0, messages: duplicates };
  }

  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async create(userData) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const validation = this.validate(userData);
      if (!validation.isValid) {
        await client.query('ROLLBACK');
        return { success: false, message: 'خطا در اعتبارسنجی', errors: validation.errors };
      }
      
      const duplicateCheck = await this.checkDuplicate(userData);
      if (!duplicateCheck.isUnique) {
        await client.query('ROLLBACK');
        return { success: false, message: 'اطلاعات تکراری', errors: duplicateCheck.messages };
      }
      
      const hashedPassword = await this.hashPassword(userData.password);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      const result = await client.query(`
        INSERT INTO users (
          username, email, phone, password, "firstName", "lastName", "fatherName",
          "nationalCode", gender, "birthDate", "birthPlace", role, "verificationToken",
          "isActive", "isVerified", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, NOW(), NOW())
        RETURNING id
      `, [
        userData.username, userData.email || null, userData.phone, hashedPassword,
        userData.firstName, userData.lastName, userData.fatherName || null,
        userData.nationalCode || null, userData.gender || 'other', 
        userData.birthDate || null, userData.birthPlace || null,
        userData.role || 'student', verificationToken
      ]);
      
      const userId = result.rows[0].id;
      await client.query('COMMIT');
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ کاربر جدید ثبت نام کرد: ${userData.username} (${responseTime}ms)`);
      addToHistory(`INSERT INTO users`, 'INSERT', responseTime, { userId });
      
      return { 
        success: true, 
        message: 'ثبت نام موفق', 
        userId, 
        verificationToken, 
        responseTime 
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در ثبت نام:', error.message);
      return { success: false, message: 'خطا در ثبت نام', error: error.message };
    } finally {
      client.release();
    }
  }

  static async createStudent(userData, studentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createResult = await this.create(userData);
      if (!createResult.success) {
        await client.query('ROLLBACK');
        return createResult;
      }
      
      await client.query(`
        INSERT INTO students (
          "userId", "studentNumber", "facultyId", "departmentId", "fieldOfStudy",
          "studyLevel", "studyType", "enrollmentYear", "enrollmentTerm", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        createResult.userId, studentData.studentNumber, studentData.facultyId || null,
        studentData.departmentId || null, studentData.fieldOfStudy || null,
        studentData.studyLevel || 'کارشناسی', studentData.studyType || 'روزانه',
        studentData.enrollmentYear || new Date().getFullYear(),
        studentData.enrollmentTerm || 1
      ]);
      
      await client.query('COMMIT');
      return { ...createResult, studentCreated: true };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در ثبت اطلاعات دانشجویی:', error.message);
      return { ...createResult, studentError: error.message };
    } finally {
      client.release();
    }
  }

  static async createProfessor(userData, professorData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createResult = await this.create({ ...userData, role: 'professor' });
      if (!createResult.success) {
        await client.query('ROLLBACK');
        return createResult;
      }
      
      await client.query(`
        INSERT INTO professors (
          "userId", "employeeNumber", "facultyId", "departmentId", 
          "academicRank", "fieldOfStudy", "hireDate", "employmentType"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        createResult.userId, professorData.employeeNumber, professorData.facultyId || null,
        professorData.departmentId || null, professorData.academicRank || 'مربی',
        professorData.fieldOfStudy || null, professorData.hireDate || new Date().toISOString().split('T')[0],
        professorData.employmentType || 'رسمی'
      ]);
      
      await client.query('COMMIT');
      return { ...createResult, professorCreated: true };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در ثبت اطلاعات استاد:', error.message);
      return { ...createResult, professorError: error.message };
    } finally {
      client.release();
    }
  }

  static async createStaff(userData, staffData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createResult = await this.create({ ...userData, role: 'staff' });
      if (!createResult.success) {
        await client.query('ROLLBACK');
        return createResult;
      }
      
      await client.query(`
        INSERT INTO staff (
          "userId", "employeeNumber", "facultyId", "departmentId", 
          "position", "jobTitle", "employmentType", "hireDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        createResult.userId, staffData.employeeNumber, staffData.facultyId || null,
        staffData.departmentId || null, staffData.position || 'کارمند',
        staffData.jobTitle || null, staffData.employmentType || 'رسمی',
        staffData.hireDate || new Date().toISOString().split('T')[0]
      ]);
      
      await client.query('COMMIT');
      return { ...createResult, staffCreated: true };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در ثبت اطلاعات کارمند:', error.message);
      return { ...createResult, staffError: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🔐 مدیریت رمز عبور
  // ========================================

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const user = await this.findById(userId);
      if (!user) {
        await client.query('ROLLBACK');
        return { success: false, message: 'کاربر یافت نشد' };
      }
      
      const isMatch = await this.comparePassword(oldPassword, user.password);
      if (!isMatch) {
        await client.query('ROLLBACK');
        return { success: false, message: 'رمز عبور فعلی اشتباه است' };
      }
      
      if (newPassword.length < 8) {
        await client.query('ROLLBACK');
        return { success: false, message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' };
      }
      
      const hashedPassword = await this.hashPassword(newPassword);
      await client.query(`
        UPDATE users SET 
          password = $1, 
          "passwordChangedAt" = NOW(), 
          "updatedAt" = NOW() 
        WHERE id = $2
      `, [hashedPassword, userId]);
      
      await this.logActivity(userId, 'PASSWORD_CHANGED');
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      addToHistory(`UPDATE users SET password`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'رمز عبور با موفقیت تغییر کرد', duration };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در تغییر رمز:', error.message);
      return { success: false, message: 'خطا در تغییر رمز عبور' };
    } finally {
      client.release();
    }
  }

  static async updatePassword(userId, newPassword) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      if (!newPassword || newPassword.length < 8) {
        return { success: false, message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' };
      }
      
      const hashedPassword = await this.hashPassword(newPassword);
      await client.query(`
        UPDATE users SET 
          password = $1, 
          "passwordChangedAt" = NOW(), 
          "updatedAt" = NOW() 
        WHERE id = $2
      `, [hashedPassword, userId]);
      
      await this.logActivity(userId, 'PASSWORD_UPDATED');
      
      const duration = Date.now() - startTime;
      addToHistory(`UPDATE users SET password`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد', duration };
      
    } catch (error) {
      console.error('❌ خطا در به‌روزرسانی رمز:', error.message);
      return { success: false, message: 'خطا در به‌روزرسانی رمز عبور' };
    } finally {
      client.release();
    }
  }

  static async resetPassword(token, newPassword) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `SELECT * FROM users WHERE "resetToken" = $1 AND "resetExpires" > NOW()`,
        [token]
      );
      const user = result.rows[0];
      
      if (!user) {
        await client.query('ROLLBACK');
        return { success: false, message: 'توکن نامعتبر یا منقضی شده است' };
      }
      
      if (newPassword.length < 8) {
        await client.query('ROLLBACK');
        return { success: false, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' };
      }
      
      const hashedPassword = await this.hashPassword(newPassword);
      await client.query(`
        UPDATE users SET 
          password = $1, 
          "passwordChangedAt" = NOW(), 
          "resetToken" = NULL, 
          "resetExpires" = NULL, 
          "updatedAt" = NOW() 
        WHERE id = $2
      `, [hashedPassword, user.id]);
      
      await this.logActivity(user.id, 'PASSWORD_RESET');
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      addToHistory(`RESET PASSWORD`, 'UPDATE', duration, { userId: user.id });
      
      return { success: true, message: 'رمز عبور با موفقیت بازنشانی شد', duration };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در بازنشانی رمز:', error.message);
      return { success: false, message: 'خطا در بازنشانی رمز عبور' };
    } finally {
      client.release();
    }
  }

  // ========================================
  // ✏️ بروزرسانی اطلاعات کاربر
  // ========================================

  static async update(userId, updateData) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const user = await this.findById(userId);
      if (!user) {
        await client.query('ROLLBACK');
        return { success: false, message: 'کاربر یافت نشد' };
      }
      
      const allowedFields = [
        'firstName', 'lastName', 'fatherName', 'email', 'phone', 'nationalCode',
        'gender', 'birthDate', 'birthPlace', 'address', 'province', 'city', 'district', 'postalCode',
        'phone2', 'phone3', 'homePhone', 'fatherPhone', 'motherPhone', 'emergencyPhone',
        'telegramId', 'instagramId', 'baleId', 'eitaaId', 'whatsapp', 'linkedin', 'twitter',
        'profilePhoto', 'bio', 'religion', 'denomination', 'bloodType',
        'educationLevel', 'fieldOfStudy', 'university', 'coverPhoto', 'website'
      ];
      
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of allowedFields) {
        if (updateData[key] !== undefined && updateData[key] !== user[key]) {
          updates.push(`"${key}" = $${paramIndex++}`);
          values.push(updateData[key]);
        }
      }
      
      if (updateData.password) {
        const hashedPassword = await this.hashPassword(updateData.password);
        updates.push(`password = $${paramIndex++}`);
        values.push(hashedPassword);
        updates.push(`"passwordChangedAt" = NOW()`);
      }
      
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return { success: true, message: 'هیچ تغییری اعمال نشد', user: this.getPublicFields(user) };
      }
      
      updates.push(`"updatedAt" = NOW()`);
      values.push(userId);
      
      await client.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      
      const updatedUserResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      const updatedUser = updatedUserResult.rows[0];
      
      await this.logActivity(userId, 'PROFILE_UPDATED', { fields: updates.map(u => u.split('=')[0].trim()) });
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      addToHistory(`UPDATE users`, 'UPDATE', duration, { userId, fields: updates.length });
      
      return { success: true, message: 'اطلاعات کاربر با موفقیت بروزرسانی شد', user: this.getPublicFields(updatedUser), duration };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ خطا در بروزرسانی کاربر:', error.message);
      return { success: false, message: 'خطا در بروزرسانی اطلاعات کاربر', error: error.message };
    } finally {
      client.release();
    }
  }

  static async updateProfile(userId, profileData) {
    return await this.update(userId, profileData);
  }

  static async updateById(userId, updateData) {
    return await this.update(userId, updateData);
  }

  static async updatePasswordDirect(userId, newPassword) {
    return await this.updatePassword(userId, newPassword);
  }

  static async save(user) {
    if (!user || !user.id) {
      return { success: false, message: 'اطلاعات کاربر نامعتبر است' };
    }
    
    try {
      const updateData = {};
      const allowedFields = [
        'username', 'email', 'phone', 'firstName', 'lastName', 'fatherName', 'nationalCode',
        'gender', 'birthDate', 'birthPlace', 'role', 'address', 'city', 'province',
        'profilePhoto', 'bio', 'isActive', 'isVerified'
      ];
      
      for (const field of allowedFields) {
        if (user[field] !== undefined) {
          updateData[field] = user[field];
        }
      }
      
      if (user.password && !user.password.startsWith('$2')) {
        updateData.password = await this.hashPassword(user.password);
      }
      
      return await this.update(user.id, updateData);
      
    } catch (error) {
      console.error('❌ خطا در ذخیره کاربر:', error.message);
      return { success: false, message: 'خطا در ذخیره کاربر' };
    }
  }

  // ========================================
  // 🗑️ مدیریت کاربران
  // ========================================

  static async deactivateUser(userId) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query(`UPDATE users SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1`, [userId]);
      await this.logActivity(userId, 'ACCOUNT_DEACTIVATED');
      
      const duration = Date.now() - startTime;
      addToHistory(`DEACTIVATE USER`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'حساب کاربری غیرفعال شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async activateUser(userId) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query(`UPDATE users SET "isActive" = true, "updatedAt" = NOW() WHERE id = $1`, [userId]);
      await this.logActivity(userId, 'ACCOUNT_ACTIVATED');
      
      const duration = Date.now() - startTime;
      addToHistory(`ACTIVATE USER`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'حساب کاربری فعال شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async verifyUser(userId) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query(`
        UPDATE users SET 
          "isVerified" = true, 
          "verificationDate" = NOW(), 
          "updatedAt" = NOW() 
        WHERE id = $1
      `, [userId]);
      
      await this.logActivity(userId, 'ACCOUNT_VERIFIED');
      
      const duration = Date.now() - startTime;
      addToHistory(`VERIFY USER`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'حساب کاربری تأیید شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async deleteUser(userId) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      console.log(`🗑️ کاربر با شناسه ${userId} حذف شد`);
      
      const duration = Date.now() - startTime;
      addToHistory(`DELETE USER`, 'DELETE', duration, { userId });
      
      return { success: true, message: 'کاربر حذف شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async hardDelete(userId) {
    return await this.deleteUser(userId);
  }

  static async softDelete(userId) {
    return await this.deactivateUser(userId);
  }

  static async restore(userId) {
    return await this.activateUser(userId);
  }

  // ========================================
  // 👑 مدیریت نقش
  // ========================================

  static async changeRole(userId, newRole) {
    const validRoles = ['student', 'professor', 'staff', 'admin', 'super_admin', 'education_manager', 'cultural_manager', 'security_manager'];
    if (!validRoles.includes(newRole)) {
      return { success: false, message: 'نقش نامعتبر است' };
    }
    
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const oldRole = await this.getRole(userId);
      
      await client.query(`UPDATE users SET role = $1, "updatedAt" = NOW() WHERE id = $2`, [newRole, userId]);
      await this.logActivity(userId, 'ROLE_CHANGED', { oldRole, newRole });
      
      const duration = Date.now() - startTime;
      addToHistory(`CHANGE ROLE`, 'UPDATE', duration, { userId, oldRole, newRole });
      
      return { success: true, message: `نقش کاربر به ${newRole} تغییر کرد`, duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async getRole(userId) {
    const user = await this.findById(userId);
    return user?.role || null;
  }

  static async assignRole(userId, roleId, assignedBy) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO user_roles ("userId", "roleId", "assignedBy", "assignedAt", "isActive")
        VALUES ($1, $2, $3, NOW(), true)
      `, [userId, roleId, assignedBy]);
      
      await this.logActivity(userId, 'ROLE_ASSIGNED', { roleId, assignedBy });
      
      const duration = Date.now() - startTime;
      addToHistory(`ASSIGN ROLE`, 'INSERT', duration, { userId, roleId });
      
      return { success: true, message: 'نقش با موفقیت اختصاص یافت', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async removeRole(userId, roleId) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query(`UPDATE user_roles SET "isActive" = false WHERE "userId" = $1 AND "roleId" = $2`, [userId, roleId]);
      await this.logActivity(userId, 'ROLE_REMOVED', { roleId });
      
      const duration = Date.now() - startTime;
      addToHistory(`REMOVE ROLE`, 'UPDATE', duration, { userId, roleId });
      
      return { success: true, message: 'نقش با موفقیت حذف شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async getUserRoles(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT r.*, ur."assignedAt", ur."expiresAt", ur."isActive" 
        FROM roles r
        JOIN user_roles ur ON r.id = ur."roleId"
        WHERE ur."userId" = $1 AND ur."isActive" = true
      `, [userId]);
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  // ========================================
  // 📊 آمار و گزارش‌گیری
  // ========================================

  static async getStats() {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const totalResult = await client.query(`SELECT COUNT(*) as total FROM users WHERE "isActive" = true`);
      const total = parseInt(totalResult.rows[0].total);
      
      const todayResult = await client.query(`SELECT COUNT(*) as today FROM users WHERE DATE("createdAt") = CURRENT_DATE`);
      const today = parseInt(todayResult.rows[0].today);
      
      const roleResult = await client.query(`SELECT role, COUNT(*) as count FROM users WHERE "isActive" = true GROUP BY role`);
      const byRole = roleResult.rows;
      
      const genderResult = await client.query(`SELECT gender, COUNT(*) as count FROM users WHERE "isActive" = true AND gender IS NOT NULL GROUP BY gender`);
      const byGender = genderResult.rows;
      
      const verifiedResult = await client.query(`SELECT COUNT(*) as verified FROM users WHERE "isVerified" = true AND "isActive" = true`);
      const verified = parseInt(verifiedResult.rows[0].verified);
      
      const activeResult = await client.query(`SELECT COUNT(*) as active FROM users WHERE "lastLogin" > NOW() - INTERVAL '30 days'`);
      const active = parseInt(activeResult.rows[0].active);
      
      const duration = Date.now() - startTime;
      
      return { 
        success: true, 
        stats: { 
          totalUsers: total, 
          todayRegistrations: today, 
          byRole,
          byGender,
          verifiedUsers: verified,
          activeUsersLast30Days: active,
          inactiveUsers: total - active
        },
        performance: { duration, durationHuman: formatDuration(duration) }
      };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async getDetailedStats() {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      // آمار دانشجویان
      const studentStatsResult = await client.query(`
        SELECT 
          COUNT(*) as "totalStudents",
          SUM(CASE WHEN "studyStatus" = 'active' THEN 1 ELSE 0 END) as "activeStudents",
          AVG(gpa) as "averageGPA",
          SUM("totalCredits") as "totalCreditsEnrolled"
        FROM students s
        JOIN users u ON s."userId" = u.id
        WHERE u."isActive" = true
      `);
      
      // آمار اساتید
      const professorStatsResult = await client.query(`
        SELECT 
          COUNT(*) as "totalProfessors",
          SUM(CASE WHEN "isAdvisor" = true THEN 1 ELSE 0 END) as "advisors",
          SUM(CASE WHEN "isThesisSupervisor" = true THEN 1 ELSE 0 END) as "thesisSupervisors"
        FROM professors p
        JOIN users u ON p."userId" = u.id
        WHERE u."isActive" = true
      `);
      
      // آمار کارکنان
      const staffStatsResult = await client.query(`
        SELECT 
          COUNT(*) as "totalStaff",
          SUM(CASE WHEN "canManageStudents" = true THEN 1 ELSE 0 END) as "studentManagers"
        FROM staff s
        JOIN users u ON s."userId" = u.id
        WHERE u."isActive" = true
      `);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        stats: {
          students: studentStatsResult.rows[0] || {},
          professors: professorStatsResult.rows[0] || {},
          staff: staffStatsResult.rows[0] || {}
        },
        performance: { duration, durationHuman: formatDuration(duration) }
      };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🏥 آمار پیشرفته
  // ========================================

  static async getTableStats() {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'
      `);
      
      const tableStats = [];
      let totalRows = 0;
      
      for (const table of tablesResult.rows) {
        const countResult = await client.query(`SELECT COUNT(*) as cnt FROM "${table.tablename}"`);
        const count = parseInt(countResult.rows[0].cnt);
        
        const columnsResult = await client.query(`
          SELECT COUNT(*) as cnt FROM information_schema.columns 
          WHERE table_name = $1
        `, [table.tablename]);
        
        const indexesResult = await client.query(`
          SELECT COUNT(*) as cnt FROM pg_indexes 
          WHERE tablename = $1
        `, [table.tablename]);
        
        totalRows += count;
        
        tableStats.push({
          table: table.tablename,
          rows: count,
          columns: parseInt(columnsResult.rows[0].cnt),
          indexes: parseInt(indexesResult.rows[0].cnt),
          estimatedSize: formatBytes(count * 100)
        });
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        totalTables: tablesResult.rows.length,
        totalRows,
        tables: tableStats,
        performance: { duration, durationHuman: formatDuration(duration) }
      };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async healthCheck() {
    const startTime = Date.now();
    const checks = [];
    let overallHealth = 100;
    const client = await pool.connect();
    
    try {
      await client.query('SELECT 1');
      checks.push({ check: 'connection', status: 'ok' });
      
      const versionResult = await client.query('SELECT version()');
      checks.push({ check: 'version', status: 'ok', version: versionResult.rows[0].version });
      
      const sizeResult = await client.query(`
        SELECT pg_database_size(current_database()) as size
      `);
      checks.push({ 
        check: 'database_size', 
        status: 'ok', 
        size: formatBytes(parseInt(sizeResult.rows[0].size))
      });
      
      const connectionsResult = await client.query(`
        SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database()
      `);
      const connections = parseInt(connectionsResult.rows[0].connections);
      checks.push({ 
        check: 'active_connections', 
        status: connections < 100 ? 'ok' : 'warning',
        connections
      });
      
    } catch (err) {
      overallHealth -= 50;
      checks.push({ check: 'connection', status: 'error', message: err.message });
    } finally {
      client.release();
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      overallHealth: Math.max(0, overallHealth),
      status: overallHealth >= 80 ? 'healthy' : overallHealth >= 50 ? 'degraded' : 'critical',
      checks,
      performance: { duration, durationHuman: formatDuration(duration) }
    };
  }

  static async optimize() {
    const startTime = Date.now();
    const steps = [];
    const client = await pool.connect();
    
    try {
      let stepStart = Date.now();
      await client.query('ANALYZE');
      steps.push({ step: 'ANALYZE', duration: Date.now() - stepStart });
      
      stepStart = Date.now();
      await client.query('VACUUM');
      steps.push({ step: 'VACUUM', duration: Date.now() - stepStart });
      
      const totalDuration = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Database optimization completed',
        totalDuration,
        totalDurationHuman: formatDuration(totalDuration),
        steps
      };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 💾 پشتیبان‌گیری و بازگردانی
  // ========================================

  static async dump(tables = null) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      let targetTables = tables;
      if (!targetTables) {
        const tablesResult = await client.query(`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'
        `);
        targetTables = tablesResult.rows.map(t => t.tablename);
      }
      
      const dump = {};
      for (const table of targetTables) {
        const rowsResult = await client.query(`SELECT * FROM "${table}"`);
        const countResult = await client.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
        
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [table]);
        
        dump[table] = {
          columns: columnsResult.rows,
          rows: rowsResult.rows,
          count: parseInt(countResult.rows[0].cnt)
        };
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        tableCount: Object.keys(dump).length,
        totalRows: Object.values(dump).reduce((sum, t) => sum + t.count, 0),
        data: dump,
        performance: { duration, durationHuman: formatDuration(duration) }
      };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async restore(dump, mode = 'replace') {
    const startTime = Date.now();
    const results = {};
    let totalInserted = 0;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const [table, data] of Object.entries(dump)) {
        if (mode === 'replace') {
          await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        }
        
        let inserted = 0;
        for (const row of data.rows) {
          const cols = Object.keys(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
          
          await client.query(
            `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`,
            Object.values(row)
          );
          inserted++;
        }
        totalInserted += inserted;
        results[table] = { inserted, totalRows: data.count };
      }
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        totalInserted,
        tableResults: results,
        performance: { duration, durationHuman: formatDuration(duration) }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🔑 توکن و OTP
  // ========================================

  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async saveOTP(phone, code, type = 'login', ipAddress = null, userAgent = null) {
    const client = await pool.connect();
    
    try {
      const expiresAt = new Date(Date.now() + 5 * 60000);
      await client.query(`
        INSERT INTO otp_codes (phone, code, type, "expiresAt", "ipAddress", "userAgent", "maxAttempts")
        VALUES ($1, $2, $3, $4, $5, $6, 3)
      `, [phone, code, type, expiresAt, ipAddress, userAgent]);
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async verifyOTP(phone, code, type = 'login') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        SELECT * FROM otp_codes 
        WHERE phone = $1 AND code = $2 AND type = $3 AND "expiresAt" > NOW() AND "usedAt" IS NULL
      `, [phone, code, type]);
      
      const otp = result.rows[0];
      
      if (!otp) {
        await client.query('ROLLBACK');
        return { valid: false, reason: 'invalid_or_expired' };
      }
      
      if (otp.attempts >= otp.maxAttempts) {
        await client.query('ROLLBACK');
        return { valid: false, reason: 'max_attempts' };
      }
      
      await client.query(`UPDATE otp_codes SET "usedAt" = NOW() WHERE id = $1`, [otp.id]);
      await client.query('COMMIT');
      
      return { valid: true };
    } catch (error) {
      await client.query('ROLLBACK');
      return { valid: false, reason: 'error' };
    } finally {
      client.release();
    }
  }

  static async incrementOTPAttempts(phone, code, type = 'login') {
    const client = await pool.connect();
    
    try {
      await client.query(`
        UPDATE otp_codes SET attempts = attempts + 1 
        WHERE phone = $1 AND code = $2 AND type = $3 AND "usedAt" IS NULL
      `, [phone, code, type]);
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
    } finally {
      client.release();
    }
  }

  static async verifyEmail(token) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE users SET 
          "isVerified" = true, 
          "verificationDate" = NOW(), 
          "updatedAt" = NOW() 
        WHERE "verificationToken" = $1
        RETURNING id
      `, [token]);
      
      if (result.rows.length > 0) {
        await this.logActivity(result.rows[0].id, 'EMAIL_VERIFIED');
      }
      
      return { success: result.rowCount > 0, message: result.rowCount > 0 ? 'ایمیل تأیید شد' : 'توکن نامعتبر است' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async setVerificationToken(userId, token) {
    const client = await pool.connect();
    
    try {
      await client.query(`UPDATE users SET "verificationToken" = $1 WHERE id = $2`, [token, userId]);
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async setResetToken(userId, token, expiresInMinutes = 60) {
    const client = await pool.connect();
    
    try {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);
      await client.query(
        `UPDATE users SET "resetToken" = $1, "resetExpires" = $2 WHERE id = $3`,
        [token, expiresAt, userId]
      );
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async clearResetToken(userId) {
    const client = await pool.connect();
    
    try {
      await client.query(`UPDATE users SET "resetToken" = NULL, "resetExpires" = NULL WHERE id = $1`, [userId]);
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async enableTwoFactor(userId, secret) {
    const client = await pool.connect();
    
    try {
      await client.query(
        `UPDATE users SET "twoFactorEnabled" = true, "twoFactorSecret" = $1 WHERE id = $2`,
        [secret, userId]
      );
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async disableTwoFactor(userId) {
    const client = await pool.connect();
    
    try {
      await client.query(
        `UPDATE users SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL WHERE id = $1`,
        [userId]
      );
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      client.release();
    }
  }

  static async isTwoFactorEnabled(userId) {
    const user = await this.findById(userId);
    return user?.twoFactorEnabled === true;
  }

  // ========================================
  // 🛡️ متدهای کمکی و ابزاری
  // ========================================

  static getPublicFields(user) {
    if (!user) return null;
    const sensitive = ['password', 'verificationToken', 'resetToken', 'twoFactorSecret'];
    const publicUser = {};
    for (const [key, value] of Object.entries(user)) {
      if (!sensitive.includes(key)) publicUser[key] = value;
    }
    return publicUser;
  }

  static maskSensitiveInfo(value, type) {
    if (!value) return '***';
    switch(type) {
      case 'phone': return value.replace(/(\d{4})\d{4}(\d{3})/, '$1****$2');
      case 'email': return value.replace(/(.{2}).*(@.*)/, '$1***$2');
      case 'nationalCode': return value.replace(/(\d{6})\d{4}/, '$1****');
      default: return value.substring(0, 2) + '***' + value.substring(value.length - 2);
    }
  }

  static validateNationalCode(nationalCode) {
    if (!/^\d{10}$/.test(nationalCode)) return false;
    const digits = nationalCode.split('').map(Number);
    const checksum = digits[9];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    const remainder = sum % 11;
    const calculatedCheck = remainder < 2 ? remainder : 11 - remainder;
    return checksum === calculatedCheck;
  }

  static validatePhone(phone) {
    return /^09\d{9}$/.test(phone);
  }

  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    const levels = ['خیلی ضعیف', 'ضعیف', 'متوسط', 'قوی', 'بسیار قوی', 'عالی'];
    return {
      score,
      level: levels[Math.min(score, 5)],
      isValid: score >= 3,
      message: score >= 3 ? 'رمز عبور قابل قبول است' : 'رمز عبور ضعیف است'
    };
  }

  static async logActivity(userId, action, details = {}) {
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO user_activity_logs ("userId", action, metadata, "createdAt")
        VALUES ($1, $2, $3, NOW())
      `, [userId, action, JSON.stringify(details)]);
      console.log(`📝 Activity logged: ${action} for user ${userId}`);
    } catch (error) {
      console.error('Error logging activity:', error.message);
    } finally {
      client.release();
    }
  }

  static async getActivityHistory(userId, limit = 50, offset = 0) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM user_activity_logs 
        WHERE "userId" = $1 
        ORDER BY "createdAt" DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);
      
      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM user_activity_logs WHERE "userId" = $1`,
        [userId]
      );
      
      const activities = result.rows.map(activity => {
        if (activity.metadata) {
          try {
            activity.metadata = JSON.parse(activity.metadata);
          } catch (e) {
            activity.metadata = {};
          }
        }
        return activity;
      });
      
      return { activities, total: parseInt(countResult.rows[0].total) };
    } catch (error) {
      return { activities: [], total: 0 };
    } finally {
      client.release();
    }
  }

  static async searchUsers(query, limit = 20) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, username, email, phone, "firstName", "lastName", role, "profilePhoto" 
        FROM users 
        WHERE "isActive" = true 
        AND (
          username ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR 
          "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR "nationalCode" ILIKE $1
        )
        LIMIT $2
      `, [`%${query}%`, limit]);
      
      const duration = Date.now() - startTime;
      
      return { 
        success: true, 
        users: result.rows, 
        count: result.rows.length, 
        performance: { duration, durationHuman: formatDuration(duration) } 
      };
    } catch (error) {
      return { success: false, users: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async exists(identifier, type = 'phone') {
    let user = null;
    switch(type) {
      case 'phone': user = await this.findByPhone(identifier); break;
      case 'email': user = await this.findByEmail(identifier); break;
      case 'username': user = await this.findByUsername(identifier); break;
      case 'id': user = await this.findById(identifier); break;
      case 'nationalCode': user = await this.findByNationalCode(identifier); break;
      default: return false;
    }
    return !!user;
  }

  static async count(filters = {}) {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE "isActive" = true';
      const params = [];
      let paramIndex = 1;
      
      if (filters.role) {
        whereClause += ` AND role = $${paramIndex++}`;
        params.push(filters.role);
      }
      if (filters.gender) {
        whereClause += ` AND gender = $${paramIndex++}`;
        params.push(filters.gender);
      }
      if (filters.isActive !== undefined) {
        whereClause += ` AND "isActive" = $${paramIndex++}`;
        params.push(filters.isActive);
      }
      if (filters.isVerified !== undefined) {
        whereClause += ` AND "isVerified" = $${paramIndex++}`;
        params.push(filters.isVerified);
      }
      
      const result = await client.query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
      );
      
      return parseInt(result.rows[0].total);
    } catch (error) {
      return 0;
    } finally {
      client.release();
    }
  }

  static async batchCreate(usersData) {
    const results = [];
    for (const userData of usersData) {
      const result = await this.create(userData);
      results.push(result);
    }
    return {
      success: results.every(r => r.success),
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  static async bulkUpdate(userIds, updateData) {
    let successCount = 0;
    for (const userId of userIds) {
      const result = await this.update(userId, updateData);
      if (result.success) successCount++;
    }
    return {
      success: successCount === userIds.length,
      total: userIds.length,
      successful: successCount,
      failed: userIds.length - successCount
    };
  }

  // ========================================
  // 📚 متدهای مرتبط با دانشجو
  // ========================================

  static async getStudentInfo(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT s.*, f.name as "facultyName", d.name as "departmentName",
               u."firstName", u."lastName", u."nationalCode", u."birthDate"
        FROM students s
        LEFT JOIN faculties f ON s."facultyId" = f.id
        LEFT JOIN departments d ON s."departmentId" = d.id
        JOIN users u ON s."userId" = u.id
        WHERE s."userId" = $1 AND u."isActive" = true
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting student info:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async updateStudentInfo(userId, studentData) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const allowedFields = [
        'studentNumber', 'facultyId', 'departmentId', 'fieldOfStudy', 'studyLevel',
        'studyType', 'enrollmentYear', 'enrollmentTerm', 'currentTerm', 'gpa',
        'totalCredits', 'earnedCredits', 'academicAdvisorId', 'culturalAdvisorId',
        'studyStatus', 'hasDormitory', 'dormitoryInfo', 'housingStatus',
        'insuranceNumber', 'insuranceExpiry', 'bankAccount', 'shabaNumber'
      ];
      
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of allowedFields) {
        if (studentData[key] !== undefined) {
          updates.push(`"${key}" = $${paramIndex++}`);
          values.push(studentData[key]);
        }
      }
      
      if (updates.length === 0) {
        return { success: true, message: 'هیچ تغییری اعمال نشد' };
      }
      
      updates.push(`"updatedAt" = NOW()`);
      values.push(userId);
      
      await client.query(
        `UPDATE students SET ${updates.join(', ')} WHERE "userId" = $${paramIndex}`,
        values
      );
      
      await this.logActivity(userId, 'STUDENT_INFO_UPDATED', { fields: updates });
      
      const duration = Date.now() - startTime;
      addToHistory(`UPDATE students`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'اطلاعات دانشجویی با موفقیت بروزرسانی شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async getStudentEnrollments(studentId, termId = null) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT e.*, c.name, c."nameFa", c.code, c.credits, c."theoryCredits", c."practiceCredits",
               CONCAT(p."firstName", ' ', p."lastName") as "professorName"
        FROM enrollments e
        JOIN courses c ON e."courseId" = c.id
        LEFT JOIN users p ON c."professorId" = p.id
        WHERE e."studentId" = $1
      `;
      const params = [studentId];
      
      if (termId) {
        query += ` AND e."termId" = $2`;
        params.push(termId);
      }
      
      query += ` ORDER BY c."nameFa"`;
      
      const result = await client.query(query, params);
      
      return { success: true, enrollments: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, enrollments: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async getStudentGrades(studentId, termId = null) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT g.*, e."finalGrade", e."gradeLetter", e."gradePoint", e.passed,
               c.name, c."nameFa", c.code, c.credits
        FROM grades g
        JOIN enrollments e ON g."enrollmentId" = e.id
        JOIN courses c ON e."courseId" = c.id
        WHERE e."studentId" = $1
      `;
      const params = [studentId];
      
      if (termId) {
        query += ` AND e."termId" = $2`;
        params.push(termId);
      }
      
      query += ` ORDER BY e."termId" DESC, c."nameFa"`;
      
      const result = await client.query(query, params);
      
      return { success: true, grades: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, grades: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async getStudentTranscript(studentId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT t.*, at.name, at."nameFa", at.year, at.term
        FROM transcripts t
        JOIN academic_terms at ON t."termId" = at.id
        WHERE t."studentId" = $1
        ORDER BY at.year DESC, at.term DESC
      `, [studentId]);
      
      return { success: true, transcripts: result.rows };
    } catch (error) {
      return { success: false, transcripts: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async getStudentAttendance(studentId, courseId = null) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT a.*, c.name, c."nameFa", c.code
        FROM attendance a
        JOIN courses c ON a."courseId" = c.id
        WHERE a."studentId" = $1
      `;
      const params = [studentId];
      
      if (courseId) {
        query += ` AND a."courseId" = $2`;
        params.push(courseId);
      }
      
      query += ` ORDER BY a."sessionDate" DESC`;
      
      const result = await client.query(query, params);
      const attendance = result.rows;
      
      const summary = {
        totalSessions: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        excused: attendance.filter(a => a.status === 'excused').length,
        percentage: attendance.length > 0 
          ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2)
          : 0
      };
      
      return { success: true, attendance, summary };
    } catch (error) {
      return { success: false, attendance: [], error: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 👨‍🏫 متدهای مرتبط با استاد
  // ========================================

  static async getProfessorInfo(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT p.*, f.name as "facultyName", d.name as "departmentName"
        FROM professors p
        LEFT JOIN faculties f ON p."facultyId" = f.id
        LEFT JOIN departments d ON p."departmentId" = d.id
        WHERE p."userId" = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting professor info:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async getProfessorCourses(professorId, termId = null) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT c.*, d."nameFa" as "departmentName", at."nameFa" as "termName"
        FROM courses c
        LEFT JOIN departments d ON c."departmentId" = d.id
        LEFT JOIN academic_terms at ON c."termId" = at.id
        WHERE c."professorId" = $1
      `;
      const params = [professorId];
      
      if (termId) {
        query += ` AND c."termId" = $2`;
        params.push(termId);
      }
      
      query += ` ORDER BY at.year DESC, at.term DESC`;
      
      const result = await client.query(query, params);
      
      return { success: true, courses: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, courses: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async getProfessorStudents(professorId, termId = null) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT DISTINCT u.id, u."firstName", u."lastName", u.phone, u.email,
               s."studentNumber", s."fieldOfStudy", s."studyLevel"
        FROM enrollments e
        JOIN users u ON e."studentId" = u.id
        JOIN students s ON u.id = s."userId"
        JOIN courses c ON e."courseId" = c.id
        WHERE c."professorId" = $1
      `;
      const params = [professorId];
      
      if (termId) {
        query += ` AND e."termId" = $2`;
        params.push(termId);
      }
      
      query += ` ORDER BY u."lastName", u."firstName"`;
      
      const result = await client.query(query, params);
      
      return { success: true, students: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, students: [], error: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 👔 متدهای مرتبط با کارمند
  // ========================================

  static async getStaffInfo(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT s.*, f.name as "facultyName", d.name as "departmentName"
        FROM staff s
        LEFT JOIN faculties f ON s."facultyId" = f.id
        LEFT JOIN departments d ON s."departmentId" = d.id
        WHERE s."userId" = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting staff info:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async getStaffSubordinates(staffId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT u.id, u."firstName", u."lastName", u.phone, u.email, s.position, s."jobTitle"
        FROM staff s
        JOIN users u ON s."userId" = u.id
        WHERE s."managerId" = $1 AND u."isActive" = true
      `, [staffId]);
      
      return { success: true, subordinates: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, subordinates: [], error: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🎓 متدهای مرتبط با دانش آموختگان
  // ========================================

  static async getAlumniInfo(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`SELECT * FROM alumni WHERE "userId" = $1`, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting alumni info:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async registerAlumni(userId, alumniData) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const existing = await this.getAlumniInfo(userId);
      if (existing) {
        client.release();
        return await this.updateAlumniInfo(userId, alumniData);
      }
      
      await client.query(`
        INSERT INTO alumni (
          "userId", "graduationYear", "graduationTerm", degree, "fieldOfStudy",
          "currentCompany", "currentPosition", "currentCity", "currentCountry", "employmentStatus",
          "linkedinUrl", "isWillingToMentor", "isWillingToVolunteer", interests, skills, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      `, [
        userId, alumniData.graduationYear, alumniData.graduationTerm, alumniData.degree,
        alumniData.fieldOfStudy, alumniData.currentCompany, alumniData.currentPosition,
        alumniData.currentCity, alumniData.currentCountry, alumniData.employmentStatus,
        alumniData.linkedinUrl, alumniData.isWillingToMentor || false,
        alumniData.isWillingToVolunteer || false, alumniData.interests,
        alumniData.skills ? JSON.stringify(alumniData.skills) : null
      ]);
      
      await this.logActivity(userId, 'ALUMNI_REGISTERED', alumniData);
      
      const duration = Date.now() - startTime;
      addToHistory(`INSERT INTO alumni`, 'INSERT', duration, { userId });
      
      return { success: true, message: 'اطلاعات دانش آموخته با موفقیت ثبت شد', duration };
    } catch (error) {
      console.error('Error registering alumni:', error);
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async updateAlumniInfo(userId, alumniData) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const allowedFields = [
        'graduationYear', 'graduationTerm', 'degree', 'fieldOfStudy', 'currentCompany',
        'currentPosition', 'currentCity', 'currentCountry', 'employmentStatus',
        'linkedinUrl', 'websiteUrl', 'isWillingToMentor', 'isWillingToVolunteer',
        'interests', 'skills'
      ];
      
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of allowedFields) {
        if (alumniData[key] !== undefined) {
          updates.push(`"${key}" = $${paramIndex++}`);
          if (key === 'skills' && typeof alumniData[key] === 'object') {
            values.push(JSON.stringify(alumniData[key]));
          } else {
            values.push(alumniData[key]);
          }
        }
      }
      
      if (updates.length === 0) {
        return { success: true, message: 'هیچ تغییری اعمال نشد' };
      }
      
      updates.push(`"updatedAt" = NOW()`);
      values.push(userId);
      
      await client.query(
        `UPDATE alumni SET ${updates.join(', ')} WHERE "userId" = $${paramIndex}`,
        values
      );
      
      await this.logActivity(userId, 'ALUMNI_INFO_UPDATED', { fields: updates });
      
      const duration = Date.now() - startTime;
      addToHistory(`UPDATE alumni`, 'UPDATE', duration, { userId });
      
      return { success: true, message: 'اطلاعات دانش آموخته با موفقیت بروزرسانی شد', duration };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🎯 متدهای مرتبط با تشکل‌ها
  // ========================================

  static async getUserOrganizations(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT o.*, om.role, om.position, om."startDate", om."endDate"
        FROM organizations o
        JOIN organization_members om ON o.id = om."organizationId"
        WHERE om."userId" = $1 AND om."isActive" = true AND o."isActive" = true
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  static async joinOrganization(userId, organizationId, role = 'member', position = null) {
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO organization_members ("organizationId", "userId", role, position, "startDate", "isActive")
        VALUES ($1, $2, $3, $4, CURRENT_DATE, true)
      `, [organizationId, userId, role, position]);
      
      await this.logActivity(userId, 'JOINED_ORGANIZATION', { organizationId, role });
      
      return { success: true, message: 'با موفقیت به تشکل پیوستید' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  static async leaveOrganization(userId, organizationId) {
    const client = await pool.connect();
    
    try {
      await client.query(`
        UPDATE organization_members SET "isActive" = false, "endDate" = CURRENT_DATE
        WHERE "userId" = $1 AND "organizationId" = $2
      `, [userId, organizationId]);
      
      await this.logActivity(userId, 'LEFT_ORGANIZATION', { organizationId });
      
      return { success: true, message: 'با موفقیت از تشکل خارج شدید' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🎯 متدهای مرتبط با بسیج
  // ========================================

  static async getBasijInfo(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`SELECT * FROM basij WHERE "userId" = $1`, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      return null;
    } finally {
      client.release();
    }
  }

  static async registerBasij(userId, basijData) {
    const client = await pool.connect();
    
    try {
      const existing = await this.getBasijInfo(userId);
      
      if (existing) {
        await client.query(`
          UPDATE basij SET 
            "membershipDate" = $1, 
            "membershipType" = $2, 
            unit = $3, 
            subunit = $4,
            responsibility = $5, 
            position = $6, 
            "updatedAt" = NOW()
          WHERE "userId" = $7
        `, [
          basijData.membershipDate, basijData.membershipType, basijData.unit,
          basijData.subunit, basijData.responsibility, basijData.position, userId
        ]);
        return { success: true, message: 'اطلاعات بسیج به‌روزرسانی شد' };
      }
      
      await client.query(`
        INSERT INTO basij ("userId", "membershipDate", "membershipType", unit, subunit, responsibility, position, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [
        userId, basijData.membershipDate, basijData.membershipType, basijData.unit,
        basijData.subunit, basijData.responsibility, basijData.position
      ]);
      
      await this.logActivity(userId, 'REGISTERED_BASIJ', basijData);
      
      return { success: true, message: 'اطلاعات بسیج با موفقیت ثبت شد' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 📊 متدهای ابزاری
  // ========================================

  static formatBytes(bytes) {
    return formatBytes(bytes);
  }

  static formatDuration(ms) {
    return formatDuration(ms);
  }

  static isValidIdentifier(name) {
    return isValidIdentifier(name);
  }

  static getQueryHistory(limit = 50) {
    return queryHistory.slice(0, limit);
  }

  static clearQueryHistory() {
    queryHistory.length = 0;
    return { success: true, message: 'Query history cleared' };
  }

  // ========================================
  // 🎯 متدهای مرتبط با رزومه و فعالیت‌ها
  // ========================================

  static async getStudentActivities(userId, type = null) {
    const client = await pool.connect();
    
    try {
      let query = `SELECT * FROM student_activities WHERE "studentId" = $1`;
      const params = [userId];
      
      if (type) {
        query += ` AND "activityType" = $2`;
        params.push(type);
      }
      
      query += ` ORDER BY "createdAt" DESC`;
      
      const result = await client.query(query, params);
      
      return { success: true, activities: result.rows, count: result.rows.length };
    } catch (error) {
      return { success: false, activities: [], error: error.message };
    } finally {
      client.release();
    }
  }

  static async addStudentActivity(userId, activityData) {
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO student_activities (
          "studentId", "activityType", title, description, 
          "startDate", "endDate", "skillLevel", "skillsAcquired", "finalResult", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        userId, activityData.activityType, activityData.title, activityData.description,
        activityData.startDate, activityData.endDate, activityData.skillLevel,
        JSON.stringify(activityData.skillsAcquired || []), activityData.finalResult
      ]);
      
      await this.logActivity(userId, 'ADDED_ACTIVITY', { activityType: activityData.activityType });
      
      return { success: true, message: 'فعالیت با موفقیت ثبت شد' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 🚀 متدهای Transaction و Batch
  // ========================================

  static async transaction(callback) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async batchInsert(tableName, rows, chunkSize = 1000) {
    const client = await pool.connect();
    const results = { inserted: 0, errors: 0 };
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        
        for (const row of chunk) {
          try {
            const cols = Object.keys(row);
            const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(',');
            
            await client.query(
              `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`,
              Object.values(row)
            );
            results.inserted++;
          } catch (err) {
            results.errors++;
            console.error(`Error inserting row:`, err.message);
          }
        }
      }
      
      await client.query('COMMIT');
      return { success: true, ...results };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message, ...results };
    } finally {
      client.release();
    }
  }

  // ========================================
  // 📈 متدهای Monitoring
  // ========================================

  static async getPoolStatus() {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  }

  static async getSlowQueries(limit = 10) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT $1
      `, [limit]);
      
      return { success: true, queries: result.rows };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  static async getTableSizes() {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);
      
      return { success: true, tables: result.rows };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }
}

// ============================================
// 📤 خروجی ماژول
// ============================================
module.exports = { User , Pool };