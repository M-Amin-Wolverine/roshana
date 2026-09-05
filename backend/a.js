const { initDatabase } = require('./config/database');

async function checkUser() {
    console.log('🔍 در حال بررسی کاربر...\n');
    
    const db = await initDatabase();
    
    try {
        // دریافت کاربر با شماره موبایل
        const stmt = db.prepare('SELECT id, phone, username, password FROM users WHERE phone = ?');
        stmt.bind(['09961358087']);
        
        let user = null;
        if (stmt.step()) {
            user = stmt.getAsObject();
        }
        stmt.free();
        
        if (!user) {
            console.log('❌ کاربر یافت نشد!');
            return;
        }
        
        console.log('✅ کاربر یافت شد:');
        console.log('   📞 Phone:', user.phone);
        console.log('   👤 Username:', user.username);
        console.log('   🔑 Password hash length:', user.password?.length);
        console.log('   🔑 Password hash starts with $2b$:', user.password?.startsWith('$2b$'));
        
    } catch (error) {
        console.error('❌ خطا:', error.message);
    }
}

checkUser();