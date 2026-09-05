/**
 * ═══════════════════════════════════════════════════════════════════
 * 🌱 Advanced Seeder System - نسخه پیشرفته
 * Database Seed Manager with Factory Pattern
 * ═══════════════════════════════════════════════════════════════════
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../../config/database');

// ═══════════════════════════════════════════════════════════════════
// 🎨 Console Colors
// ═══════════════════════════════════════════════════════════════════

const Colors = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    GRAY: '\x1b[90m',
    BOLD: '\x1b[1m',
    BG_GREEN: '\x1b[42m',
    BG_BLUE: '\x1b[44m'
};

const log = {
    info: (msg) => console.log(`${Colors.CYAN}ℹ${Colors.RESET} ${msg}`),
    success: (msg) => console.log(`${Colors.GREEN}✓${Colors.RESET} ${msg}`),
    warn: (msg) => console.log(`${Colors.YELLOW}⚠${Colors.RESET} ${msg}`),
    error: (msg) => console.log(`${Colors.RED}✗${Colors.RESET} ${msg}`),
    step: (msg) => console.log(`${Colors.MAGENTA}→${Colors.RESET} ${msg}`),
    sub: (msg) => console.log(`${Colors.GRAY}  ├─${Colors.RESET} ${msg}`),
    done: (msg) => console.log(`${Colors.GREEN}  └─${Colors.RESET} ${msg}`),
    header: (msg) => console.log(`\n${Colors.BOLD}${Colors.BG_BLUE} ${msg} ${Colors.RESET}\n`),
    table: (data) => console.table(data)
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 Configuration
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    BCRYPT_ROUNDS: 12,
    DEFAULT_PASSWORD: 'Roshana@123',
    SEEDER_TABLE: '__seeders',
    BATCH_SIZE: 100,
    PROGRESS_BAR_LENGTH: 30
};

// ═══════════════════════════════════════════════════════════════════
// 🎲 Data Factory - Generate realistic test data
// ═══════════════════════════════════════════════════════════════════

class Factory {
    constructor() {
        this.firstNames = [
            'علی', 'محمد', 'احمد', 'رضا', 'محمدرضا', 'سید', 'حمید', 'مهدی', 
            'کاظم', 'عباس', 'عبدالله', 'ناصر', 'پرویز', 'داوود', 'هادی',
            'سارا', 'مریم', 'فاطمه', 'زهرا', 'معصومه', 'بتول', 'رقیه', 
            'سمیه', 'نورا', 'پری', 'لیلا', 'آزاده', 'مونا', 'هلیا'
        ];
        
        this.lastNames = [
            'محمدی', 'احمدی', 'رضایی', 'محمدرضایی', 'سیدی', 'حمیدی', 'مهدوی',
            'کاظمی', 'عباسی', 'عبداللهی', 'ناصری', 'پرویزی', 'داوودی', 'هادی',
            ' Ahmadi', 'Rezaei', 'Mohammadi', 'Karimi', 'Jafari', 'Mousavi',
            'Hashemi', 'Rahimi', 'Farahani', 'Babaei', 'Tehrani', 'Shirazi'
        ];
        
        this.domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'roshana.ir'];
        this.cities = [
            { name: 'تهران', en: 'Tehran', code: 'THR' },
            { name: 'مشهد', en: 'Mashhad', code: 'MHD' },
            { name: 'اصفهان', en: 'Isfahan', code: 'ISF' },
            { name: 'کرج', en: 'Karaj', code: 'KAR' },
            { name: 'شیراز', en: 'Shiraz', code: 'SYZ' },
            { name: 'تبریز', en: 'Tabriz', code: 'TBZ' },
            { name: 'قم', en: 'Qom', code: 'QOM' },
            { name: 'اهواز', en: 'Ahvaz', code: 'AWZ' }
        ];
    }

    /**
     * Generate random first name
     */
    firstName() {
        return this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    }

    /**
     * Generate random last name
     */
    lastName() {
        return this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    }

    /**
     * Generate random full name
     */
    fullName() {
        return `${this.firstName()} ${this.lastName()}`;
    }

    /**
     * Generate random email
     */
    email(firstName = null, lastName = null) {
        const name = firstName || this.firstName();
        const family = lastName || this.lastName();
        const domain = this.domains[Math.floor(Math.random() * this.domains.length)];
        const separator = ['.', '_', ''][Math.floor(Math.random() * 3)];
        const number = Math.random() > 0.5 ? Math.floor(Math.random() * 99) : '';
        
        return `${name.toLowerCase()}${separator}${family.toLowerCase()}${number}@${domain}`;
    }

    /**
     * Generate random Iranian phone number
     */
    phone() {
        const prefixes = ['0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0990', '0991'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return prefix + number;
    }

    /**
     * Generate random username
     */
    username(firstName = null, lastName = null) {
        const name = firstName || this.firstName();
        const family = lastName || this.lastName();
        const number = Math.floor(Math.random() * 999);
        const separator = ['', '.', '_'][Math.floor(Math.random() * 3)];
        
        return `${name.toLowerCase()}${separator}${family.toLowerCase()}${number}`;
    }

    /**
     * Generate random city
     */
    city() {
        return this.cities[Math.floor(Math.random() * this.cities.length)];
    }

    /**
     * Generate random date in range
     */
    date(startDate, endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return new Date(start + Math.random() * (end - start));
    }

    /**
     * Generate random boolean with weight
     */
    boolean(weight = 0.5) {
        return Math.random() < weight;
    }

    /**
     * Generate random item from array
     */
    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Generate random items from array
     */
    randomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Generate random number in range
     */
    number(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate avatar URL
     */
    avatar(gender = 'mixed') {
        const id = Math.floor(Math.random() * 70) + 1;
        const style = ['avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'notionists'][Math.floor(Math.random() * 6)];
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${id}`;
    }

    /**
     * Generate bio
     */
    bio() {
        const bios = [
            'علاقه‌مند به تکنولوژی و برنامه‌نویسی',
            'توسعه‌دهنده وب و موبایل',
            'طراح و معمار نرم‌افزار',
            'مدیر پروژه با تجربه',
            'علاقه‌مند به یادگیری ماشین',
            'طرفدار متن‌باز',
            'علاقه‌مند به امنیت سایبری',
            'مدرس و مربی برنامه‌نویسی'
        ];
        return this.randomItem(bios);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📊 Seeder Class
// ═══════════════════════════════════════════════════════════════════

class Seeder {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.factory = new Factory();
        this.startTime = null;
        this.seeded = 0;
        this.skipped = 0;
        this.errors = [];
    }

    start() {
        this.startTime = Date.now();
        log.header(`🌱 Seeder: ${this.name}`);
        log.info(this.description);
    }

    end() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        log.header(`✅ Seeding Complete: ${this.name}`);
        log.sub(`Total seeded: ${Colors.GREEN}${this.seeded}${Colors.RESET}`);
        log.sub(`Total skipped: ${Colors.YELLOW}${this.skipped}${Colors.RESET}`);
        log.sub(`Duration: ${duration}s`);
        
        if (this.errors.length > 0) {
            log.warn(`Errors: ${this.errors.length}`);
            this.errors.forEach(err => log.error(err));
        }
    }

    async withTransaction(callback) {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async exists(table, column, value) {
        const [rows] = await db.query(
            `SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`,
            [value]
        );
        return rows.length > 0;
    }

    async insert(table, data) {
        try {
            const [result] = await db.query(`INSERT INTO ${table} SET ?`, data);
            this.seeded++;
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                this.skipped++;
                return null;
            }
            this.errors.push(error.message);
            throw error;
        }
    }

    async bulkInsert(table, dataArray) {
        if (dataArray.length === 0) return;
        
        const columns = Object.keys(dataArray[0]);
        const placeholders = dataArray.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
        const values = dataArray.flatMap(row => columns.map(col => row[col]));
        
        try {
            await db.query(
                `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`,
                values
            );
            this.seeded += dataArray.length;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                this.skipped += dataArray.length;
            } else {
                this.errors.push(error.message);
                throw error;
            }
        }
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS);
    }

    progress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const filled = Math.round((current / total) * CONFIG.PROGRESS_BAR_LENGTH);
        const empty = CONFIG.PROGRESS_BAR_LENGTH - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        process.stdout.write(`\r${Colors.CYAN}├${Colors.RESET} [${Colors.GREEN}${bar}${Colors.RESET}] ${percentage}% ${message}`);
        
        if (current === total) {
            console.log('\n');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 👥 Main Seeder
// ═══════════════════════════════════════════════════════════════════

const seeder = new Seeder(
    '001_users',
    'Seed initial users with different roles and test data'
);

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🌱 Seed Data
 * ═══════════════════════════════════════════════════════════════════
 */

const seed = async () => {
    seeder.start();
    
    const hashedPassword = await seeder.hashPassword(CONFIG.DEFAULT_PASSWORD);
    const adminPassword = await seeder.hashPassword('Admin@123');
    
    // ═══════════════════════════════════════════════════════════════
    // 👑 Seed Users
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Creating users...');
    
    // Admin users
    const adminUsers = [
        {
            username: 'admin',
            email: 'admin@roshana.com',
            password: adminPassword,
            first_name: 'مدیر',
            last_name: 'سیستم',
            phone: '09120000000',
            role: 'admin',
            status: 'active',
            is_active: true,
            is_verified: true,
            is_email_verified: true,
            is_phone_verified: true,
            bio: 'مدیر ارشد سیستم'
        },
        {
            username: 'super_admin',
            email: 'superadmin@roshana.com',
            password: adminPassword,
            first_name: 'سوپر',
            last_name: 'ادمین',
            phone: '09120000001',
            role: 'super_admin',
            status: 'active',
            is_active: true,
            is_verified: true,
            is_email_verified: true,
            is_phone_verified: true,
            bio: 'مدیر ارشد و بنیانگذار'
        },
        {
            username: 'moderator',
            email: 'moderator@roshana.com',
            password: hashedPassword,
            first_name: 'مدیر',
            last_name: 'محتوا',
            phone: '09120000002',
            role: 'moderator',
            status: 'active',
            is_active: true,
            is_verified: true,
            is_email_verified: true,
            is_phone_verified: true,
            bio: 'مدیر محتوا'
        }
    ];
    
    for (const user of adminUsers) {
        if (!(await seeder.exists('users', 'username', user.username))) {
            await seeder.insert('users', user);
            log.sub(`Created: ${user.username} (${user.role})`);
        } else {
            seeder.skipped++;
            log.sub(`Skipped: ${user.username} (already exists)`);
        }
    }
    
    // Test user
    const testUser = {
        username: 'testuser',
        email: 'test@roshana.com',
        password: hashedPassword,
        first_name: 'کاربر',
        last_name: 'تست',
        phone: '09120000003',
        role: 'user',
        status: 'active',
        is_active: true,
        is_verified: true,
        is_email_verified: true,
        is_phone_verified: true,
        bio: 'کاربر تست'
    };
    
    if (!(await seeder.exists('users', 'username', testUser.username))) {
        await seeder.insert('users', testUser);
        log.sub('Created: testuser (user)');
    } else {
        seeder.skipped++;
        log.sub('Skipped: testuser (already exists)');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 👥 Generate Random Users (Factory Pattern)
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Generating random users with Factory...');
    
    const randomUsers = [];
    const userCount = 50;
    
    for (let i = 0; i < userCount; i++) {
        const firstName = seeder.factory.firstName();
        const lastName = seeder.factory.lastName();
        
        const user = {
            username: seeder.factory.username(firstName, lastName),
            email: seeder.factory.email(firstName, lastName),
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            phone: seeder.factory.phone(),
            role: seeder.factory.randomItem(['user', 'user', 'user', 'moderator']),
            status: seeder.factory.boolean(0.9) ? 'active' : 'inactive',
            is_active: seeder.factory.boolean(0.9),
            is_verified: seeder.factory.boolean(0.7),
            is_email_verified: seeder.factory.boolean(0.7),
            is_phone_verified: seeder.factory.boolean(0.6),
            avatar: seeder.factory.avatar(),
            bio: seeder.factory.bio(),
            created_at: seeder.factory.date(
                new Date('2023-01-01'),
                new Date()
            )
        };
        
        randomUsers.push(user);
        
        // Progress bar
        if ((i + 1) % 10 === 0 || i === userCount - 1) {
            seeder.progress(i + 1, userCount, 'Generating users');
        }
    }
    
    // Bulk insert
    await seeder.bulkInsert('users', randomUsers);
    
    // ═══════════════════════════════════════════════════════════════
    // 🔐 Seed OTP Codes (for testing)
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Creating OTP records...');
    
    const [users] = await db.query('SELECT id FROM users LIMIT 10');
    const otpRecords = [];
    
    for (const user of users) {
        // Login OTP
        otpRecords.push({
            user_id: user.id,
            code: String(Math.floor(100000 + Math.random() * 900000)),
            type: 'login',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            is_used: false,
            created_at: new Date()
        });
        
        // Register OTP
        otpRecords.push({
            user_id: user.id,
            code: String(Math.floor(100000 + Math.random() * 900000)),
            type: 'register',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            is_used: seeder.factory.boolean(0.3),
            used_at: seeder.factory.boolean(0.3) ? new Date() : null,
            created_at: seeder.factory.date(new Date('2024-01-01'), new Date())
        });
    }
    
    await seeder.bulkInsert('otps', otpRecords);
    log.sub(`Created: ${otpRecords.length} OTP records`);
    
    // ═══════════════════════════════════════════════════════════════
    // 💻 Seed Sessions
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Creating sessions...');
    
    const sessions = [];
    const sessionCount = 30;
    
    for (let i = 0; i < sessionCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        sessions.push({
            user_id: randomUser.id,
            session_id: crypto.randomUUID(),
            device_type: seeder.factory.randomItem(['desktop', 'mobile', 'tablet']),
            device_name: seeder.factory.randomItem(['Chrome', 'Firefox', 'Safari', 'Edge']),
            browser: seeder.factory.randomItem(['Chrome', 'Firefox', 'Safari']),
            os: seeder.factory.randomItem(['Windows', 'macOS', 'Linux', 'Android', 'iOS']),
            ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            is_active: seeder.factory.boolean(0.7),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: seeder.factory.date(new Date('2024-01-01'), new Date())
        });
    }
    
    await seeder.bulkInsert('sessions', sessions);
    log.sub(`Created: ${sessions.length} sessions`);
    
    // ═══════════════════════════════════════════════════════════════
    // 📝 Seed Activity Logs
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Creating activity logs...');
    
    const activities = [];
    const activityActions = [
        'user.login', 'user.logout', 'user.register', 'user.profile.update',
        'user.password.change', 'user.email.verify', 'user.phone.verify',
        'post.create', 'post.update', 'post.delete', 'post.like',
        'comment.create', 'comment.update', 'comment.delete',
        'file.upload', 'file.download', 'file.delete',
        'settings.update', 'admin.user.create', 'admin.user.update'
    ];
    
    const logCount = 100;
    
    for (let i = 0; i < logCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        activities.push({
            user_id: randomUser.id,
            action: seeder.factory.randomItem(activityActions),
            entity_type: seeder.factory.randomItem(['user', 'post', 'comment', 'file', 'settings']),
            entity_id: seeder.factory.number(1, 1000),
            description: `Activity ${i + 1}`,
            ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            status: seeder.factory.boolean(0.95) ? 'success' : 'failed',
            created_at: seeder.factory.date(new Date('2024-01-01'), new Date())
        });
    }
    
    await seeder.bulkInsert('activity_logs', activities);
    log.sub(`Created: ${activities.length} activity logs`);
    
    // ═══════════════════════════════════════════════════════════════
    // 🔔 Seed Notifications
    // ═══════════════════════════════════════════════════════════════
    
    log.step('Creating notifications...');
    
    const notifications = [];
    const notificationTypes = [
        'system', 'security', 'payment', 'order', 'message', 'friend_request', 'like', 'comment'
    ];
    const notificationTitles = [
        'خوش آمدید', 'تغییرات امنیتی', 'پرداخت موفق', 'سفارش جدید',
        'پیام جدید', 'درخواست دوستی', 'لایک جدید', 'کامنت جدید'
    ];
    
    for (const user of users.slice(0, 20)) {
        const notifCount = seeder.factory.number(1, 5);
        
        for (let i = 0; i < notifCount; i++) {
            notifications.push({
                user_id: user.id,
                type: seeder.factory.randomItem(notificationTypes),
                title: seeder.factory.randomItem(notificationTitles),
                message: 'این یک اعلان تستی است',
                is_read: seeder.factory.boolean(0.6),
                read_at: seeder.factory.boolean(0.6) ? new Date() : null,
                priority: seeder.factory.randomItem(['low', 'normal', 'high', 'urgent']),
                created_at: seeder.factory.date(new Date('2024-01-01'), new Date())
            });
        }
    }
    
    await seeder.bulkInsert('notifications', notifications);
    log.sub(`Created: ${notifications.length} notifications`);
    
    // ═══════════════════════════════════════════════════════════════
    // 📊 Summary
    // ═══════════════════════════════════════════════════════════════
    
    seeder.end();
    
    // Final summary
    log.header('📊 Seeding Summary');
    log.table({
        'Admin Users': adminUsers.length + 1,
        'Random Users': userCount,
        'OTP Records': otpRecords.length,
        'Sessions': sessions.length,
        'Activity Logs': activities.length,
        'Notifications': notifications.length,
        'Total Records': adminUsers.length + 1 + userCount + otpRecords.length + sessions.length + activities.length + notifications.length
    });
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * ⏪ Rollback
 * ═══════════════════════════════════════════════════════════════════
 */

const rollback = async () => {
    log.header('🔄 Rolling back seeder: 001_users');
    
    try {
        // Delete in reverse order (respecting foreign keys)
        await db.query('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users)');
        log.success('Deleted: notifications');
        
        await db.query('DELETE FROM activity_logs WHERE user_id IN (SELECT id FROM users)');
        log.success('Deleted: activity_logs');
        
        await db.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users)');
        log.success('Deleted: sessions');
        
        await db.query('DELETE FROM otps WHERE user_id IN (SELECT id FROM users)');
        log.success('Deleted: otps');
        
        await db.query('DELETE FROM users WHERE username NOT IN (?, ?, ?)', [
            'system_reserved_admin',
            'system_reserved_moderator',
            'system_reserved_user'
        ]);
        
        // Delete specific users
        await db.query('DELETE FROM users WHERE username IN (?, ?, ?, ?, ?)', [
            'admin',
            'super_admin',
            'moderator',
            'testuser',
            'testuser_roshana'
        ]);
        
        log.success('Deleted: users');
        
        log.header('✅ Rollback completed successfully');
        
    } catch (error) {
        log.error(`Rollback failed: ${error.message}`);
        throw error;
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔄 Refresh - Delete and re-seed
 * ═══════════════════════════════════════════════════════════════════
 */

const refresh = async () => {
    log.header('🔄 Refreshing seeder: 001_users');
    await rollback();
    await seed();
};

// ═══════════════════════════════════════════════════════════════════
// 📤 Export
// ═══════════════════════════════════════════════════════════════════

module.exports = {
    seed,
    rollback,
    refresh,
    
    // Metadata
    name: seeder.name,
    description: seeder.description,
    version: '1.0.0',
    author: 'Roshana Team',
    
    // Factory for external use
    Factory,
    
    // Configuration
    config: CONFIG
};