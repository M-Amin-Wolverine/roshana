/**
 * ═══════════════════════════════════════════════════════════════════
 * 📦 Migration System - نسخه پیشرفته
 * Database Schema Migration Manager
 * ═══════════════════════════════════════════════════════════════════
 */

const db = require('../../config/database');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// 🎨 Colors for console output
// ═══════════════════════════════════════════════════════════════════

const Colors = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    GRAY: '\x1b[90m'
};

const log = {
    info: (msg) => console.log(`${Colors.CYAN}ℹ${Colors.RESET} ${msg}`),
    success: (msg) => console.log(`${Colors.GREEN}✓${Colors.RESET} ${msg}`),
    warn: (msg) => console.log(`${Colors.YELLOW}⚠${Colors.RESET} ${msg}`),
    error: (msg) => console.log(`${Colors.RED}✗${Colors.RESET} ${msg}`),
    step: (msg) => console.log(`${Colors.MAGENTA}→${Colors.RESET} ${msg}`),
    table: (msg) => console.log(`${Colors.GRAY}  ${msg}${Colors.RESET}`)
};

// ═══════════════════════════════════════════════════════════════════
// 🏗️ Migration Class
// ═══════════════════════════════════════════════════════════════════

class Migration {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Start timing
     */
    start() {
        this.startTime = Date.now();
        log.step(`Running migration: ${this.name}`);
        if (this.description) {
            log.table(`Description: ${this.description}`);
        }
    }

    /**
     * End timing and log success
     */
    end() {
        this.endTime = Date.now();
        const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
        log.success(`Migration "${this.name}" completed in ${duration}s`);
    }

    /**
     * Log error and throw
     */
    fail(error) {
        this.endTime = Date.now();
        log.error(`Migration "${this.name}" failed: ${error.message}`);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📋 Migration: 001_initial_schema
// ═══════════════════════════════════════════════════════════════════

const migration = new Migration(
    '001_initial_schema',
    'Create initial database schema with users, auth, and sessions'
);

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔧 Up Migration - Create all tables
 * ═══════════════════════════════════════════════════════════════════
 */

const up = async () => {
    const connection = await db.getConnection();
    
    try {
        migration.start();
        
        // Start transaction
        await connection.beginTransaction();
        
        // ═══════════════════════════════════════════════════════════
        // 📊 Migration Log Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating migration tracking table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS __migrations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                batch INT NOT NULL,
                checksum VARCHAR(64) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                rollback_sql TEXT,
                INDEX idx_name (name),
                INDEX idx_batch (batch)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 👥 Users Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating users table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL COMMENT 'نام کاربری یکتا',
                email VARCHAR(100) UNIQUE NOT NULL COMMENT 'ایمیل یکتا',
                password VARCHAR(255) NOT NULL COMMENT 'رمز عبور هش شده',
                phone VARCHAR(20) UNIQUE COMMENT 'شماره موبایل',
                first_name VARCHAR(50) COMMENT 'نام',
                last_name VARCHAR(50) COMMENT 'نام خانوادگی',
                avatar VARCHAR(500) COMMENT 'آواتار',
                bio TEXT COMMENT 'بیوگرافی',
                role ENUM('user', 'admin', 'moderator', 'super_admin') 
                    DEFAULT 'user' COMMENT 'نقش کاربر',
                status ENUM('active', 'inactive', 'suspended', 'banned') 
                    DEFAULT 'active' COMMENT 'وضعیت حساب',
                is_active BOOLEAN DEFAULT TRUE COMMENT 'فعال/غیرفعال',
                is_verified BOOLEAN DEFAULT FALSE COMMENT 'تایید شده',
                is_email_verified BOOLEAN DEFAULT FALSE COMMENT 'تایید ایمیل',
                is_phone_verified BOOLEAN DEFAULT FALSE COMMENT 'تایید موبایل',
                last_login DATETIME COMMENT 'آخرین ورود',
                last_login_ip VARCHAR(45) COMMENT 'آیپی آخرین ورود',
                login_count INT DEFAULT 0 COMMENT 'تعداد ورود',
                password_changed_at DATETIME COMMENT 'زمان تغییر رمز عبور',
                password_version INT DEFAULT 1 COMMENT 'نسخه رمز عبور',
                failed_login_attempts INT DEFAULT 0 COMMENT 'تلاش‌های ناموفق',
                locked_until DATETIME COMMENT 'قفل شده تا',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL COMMENT 'زمان حذف نرم',
                
                -- Indexes
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_role (role),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                INDEX idx_deleted_at (deleted_at),
                INDEX idx_composite_active_role (is_active, role),
                
                -- Fulltext search
                FULLTEXT INDEX ft_username (username),
                FULLTEXT INDEX ft_name (first_name, last_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول کاربران اصلی'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 🔐 OTP Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating otps table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                code VARCHAR(10) NOT NULL COMMENT 'کد OTP',
                type ENUM('register', 'login', 'reset_password', 'change_email', 'change_phone', 'verify_phone', 'verify_email') 
                    DEFAULT 'login' COMMENT 'نوع OTP',
                purpose VARCHAR(50) COMMENT 'هدف استفاده',
                expires_at DATETIME NOT NULL COMMENT 'انقضا',
                is_used BOOLEAN DEFAULT FALSE COMMENT 'استفاده شده',
                used_at DATETIME COMMENT 'زمان استفاده',
                ip_address VARCHAR(45) COMMENT 'آیپی درخواست',
                user_agent TEXT COMMENT 'User Agent',
                attempts INT DEFAULT 0 COMMENT 'تعداد تلاش',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_code (code),
                INDEX idx_type (type),
                INDEX idx_expires (expires_at),
                INDEX idx_composite_user_type (user_id, type),
                INDEX idx_composite_active (user_id, type, is_used, expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول کدهای یکبار مصرف'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 🔄 Refresh Tokens Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating refresh_tokens table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                token VARCHAR(500) NOT NULL COMMENT 'توکن refresh',
                token_family VARCHAR(64) COMMENT 'خانواده توکن (برای invalid کردن همه)',
                expires_at DATETIME NOT NULL COMMENT 'انقضا',
                is_revoked BOOLEAN DEFAULT FALSE COMMENT 'بازگشت خورده',
                revoked_at DATETIME COMMENT 'زمان بازگشت',
                revoked_reason VARCHAR(255) دلیل بازگشت',
                ip_address VARCHAR(45) COMMENT 'آیپی درخواست',
                user_agent TEXT COMMENT 'User Agent',
                device_info VARCHAR(255) COMMENT 'اطلاعات دستگاه',
                location VARCHAR(255) COMMENT 'موقعیت مکانی',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_token (token(255)),
                INDEX idx_token_family (token_family),
                INDEX idx_expires (expires_at),
                INDEX idx_composite_user_active (user_id, is_revoked, expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول refresh token ها'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 🔑 Password Reset Tokens Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating password_reset_tokens table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                token VARCHAR(255) NOT NULL COMMENT 'توکن بازیابی',
                token_hash VARCHAR(64) NOT NULL COMMENT 'هش توکن',
                expires_at DATETIME NOT NULL COMMENT 'انقضا',
                is_used BOOLEAN DEFAULT FALSE COMMENT 'استفاده شده',
                used_at DATETIME COMMENT 'زمان استفاده',
                ip_address VARCHAR(45) COMMENT 'آیپی درخواست',
                user_agent TEXT COMMENT 'User Agent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_token (token),
                INDEX idx_token_hash (token_hash),
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول توکن‌های بازیابی رمز عبور'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 💻 Sessions Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating sessions table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                session_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'شناسه جلسه',
                access_token_hash VARCHAR(64) COMMENT 'هش توکن دسترسی',
                device_type VARCHAR(20) COMMENT 'نوع دستگاه',
                device_name VARCHAR(100) COMMENT 'نام دستگاه',
                browser VARCHAR(100) COMMENT 'مرورگر',
                os VARCHAR(50) COMMENT 'سیستم عامل',
                ip_address VARCHAR(45) COMMENT 'آیپی',
                country VARCHAR(50) COMMENT 'کشور',
                city VARCHAR(50) COMMENT 'شهر',
                user_agent TEXT COMMENT 'User Agent کامل',
                is_active BOOLEAN DEFAULT TRUE COMMENT 'فعال',
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'آخرین فعالیت',
                expires_at DATETIME COMMENT 'انقضا جلسه',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_session_id (session_id),
                INDEX idx_access_token_hash (access_token_hash),
                INDEX idx_is_active (is_active),
                INDEX idx_last_activity (last_activity),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول جلسات کاربران'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 📝 Activity Log Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating activity_logs table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id INT COMMENT 'شناسه کاربر (nullable برای مهمان)',
                action VARCHAR(100) NOT NULL COMMENT 'عملیات',
                entity_type VARCHAR(50) COMMENT 'نوع موجودیت',
                entity_id INT COMMENT 'شناسه موجودیت',
                description TEXT COMMENT 'توضیحات',
                metadata JSON COMMENT 'اطلاعات اضافی',
                ip_address VARCHAR(45) COMMENT 'آیپی',
                user_agent TEXT COMMENT 'User Agent',
                location VARCHAR(255) COMMENT 'موقعیت',
                status ENUM('success', 'failed', 'pending') DEFAULT 'success' COMMENT 'وضعیت',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_created_at (created_at),
                INDEX idx_status (status),
                INDEX idx_composite_user_action (user_id, action)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول لاگ فعالیت‌ها'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 🔔 Notifications Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating notifications table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                type VARCHAR(50) NOT NULL COMMENT 'نوع اعلان',
                title VARCHAR(200) NOT NULL COMMENT 'عنوان',
                message TEXT COMMENT 'پیام',
                data JSON COMMENT 'داده‌های اضافی',
                link VARCHAR(500) COMMENT 'لینک مرتبط',
                image VARCHAR(500) COMMENT 'تصویر',
                is_read BOOLEAN DEFAULT FALSE COMMENT 'خوانده شده',
                read_at DATETIME COMMENT 'زمان خوانده شدن',
                is_archived BOOLEAN DEFAULT FALSE COMMENT 'آرشیو شده',
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'اولویت',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_type (type),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at),
                INDEX idx_composite_user_read (user_id, is_read, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول اعلان‌ها'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 📧 Email Verification Table
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating email_verifications table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT 'شناسه کاربر',
                email VARCHAR(100) NOT NULL COMMENT 'ایمیل جدید',
                token VARCHAR(255) NOT NULL COMMENT 'توکن تایید',
                token_hash VARCHAR(64) NOT NULL COMMENT 'هش توکن',
                expires_at DATETIME NOT NULL COMMENT 'انقضا',
                is_verified BOOLEAN DEFAULT FALSE COMMENT 'تایید شده',
                verified_at DATETIME COMMENT 'زمان تایید',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes
                INDEX idx_user_id (user_id),
                INDEX idx_token (token),
                INDEX idx_token_hash (token_hash),
                INDEX idx_email (email),
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول تایید ایمیل'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 📱 Login Attempts Table (Rate Limiting)
        // ═══════════════════════════════════════════════════════════
        
        log.step('Creating login_attempts table...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(100) COMMENT 'ایمیل',
                phone VARCHAR(20) COMMENT 'موبایل',
                ip_address VARCHAR(45) NOT NULL COMMENT 'آیپی',
                user_agent TEXT COMMENT 'User Agent',
                success BOOLEAN DEFAULT FALSE COMMENT 'موفق',
                attempt_count INT DEFAULT 1 COMMENT 'تعداد تلاش',
                locked_until DATETIME COMMENT 'قفل شده تا',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Indexes
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_ip_address (ip_address),
                INDEX idx_created_at (created_at),
                INDEX idx_locked_until (locked_until)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='جدول تلاش‌های ورود'
        `);
        
        // ═══════════════════════════════════════════════════════════
        // 🔒 Foreign Key Constraints
        // ═══════════════════════════════════════════════════════════
        
        log.step('Adding foreign key constraints...');
        
        // Enable foreign keys check
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Commit transaction
        await connection.commit();
        
        // ═══════════════════════════════════════════════════════════
        // 📊 Log Migration
        // ═══════════════════════════════════════════════════════════
        
        const checksum = crypto.createHash('sha256')
            .update(JSON.stringify({ name: migration.name }))
            .digest('hex');
        
        await connection.query(`
            INSERT INTO __migrations (name, batch, checksum, rollback_sql) 
            VALUES (?, 1, ?, ?)
        `, [
            migration.name,
            checksum,
            'DROP TABLE IF EXISTS login_attempts, email_verifications, notifications, activity_logs, sessions, password_reset_tokens, refresh_tokens, otps, users'
        ]);
        
        migration.end();
        
    } catch (error) {
        // Rollback on error
        await connection.rollback();
        migration.fail(error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * ⏪ Down Migration - Drop all tables
 * ═══════════════════════════════════════════════════════════════════
 */

const down = async () => {
    const connection = await db.getConnection();
    
    try {
        migration.start();
        
        await connection.beginTransaction();
        
        // Drop tables in reverse order (respecting foreign keys)
        log.step('Dropping tables...');
        
        const tables = [
            'login_attempts',
            'email_verifications',
            'notifications',
            'activity_logs',
            'sessions',
            'password_reset_tokens',
            'refresh_tokens',
            'otps',
            'users',
            '__migrations'
        ];
        
        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
            log.table(`Dropped: ${table}`);
        }
        
        await connection.commit();
        
        migration.end();
        
    } catch (error) {
        await connection.rollback();
        migration.fail(error);
        throw error;
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════════════
// 📤 Export
// ═══════════════════════════════════════════════════════════════════

module.exports = {
    up,
    down,
    
    // Metadata
    name: migration.name,
    description: migration.description,
    version: '1.0.0',
    author: 'Roshana Team',
    
    // Dependencies
    dependencies: [],
    
    // Rollback SQL (for manual rollback)
    rollbackSQL: `
        DROP TABLE IF EXISTS login_attempts;
        DROP TABLE IF EXISTS email_verifications;
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS activity_logs;
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS password_reset_tokens;
        DROP TABLE IF EXISTS refresh_tokens;
        DROP TABLE IF EXISTS otps;
        DROP TABLE IF EXISTS users;
    `
};