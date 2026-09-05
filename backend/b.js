const bcrypt = require('bcrypt');
const { initDatabase } = require('./config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function checkMyPassword() {
    console.log('🔍 بررسی رمز عبور شما...\n');
    
    const db = await initDatabase();
    
    // دریافت کاربر
    const stmt = db.prepare('SELECT id, phone, username, password FROM users WHERE phone = ?');
    stmt.bind(['09961358087']);
    
    let user = null;
    if (stmt.step()) {
        user = stmt.getAsObject();
    }
    stmt.free();
    
    if (!user) {
        console.log('❌ کاربر یافت نشد!');
        rl.close();
        return;
    }
    
    console.log('✅ کاربر یافت شد');
    console.log('📞 Phone:', user.phone);
    console.log('👤 Username:', user.username);
    console.log('🔑 Hash ذخیره شده:', user.password.substring(0, 30) + '...');
    console.log('');
    
    // از کاربر رمز جدیدش رو بپرس
    rl.question('🔐 رمز جدیدی که در تغییر رمز وارد کردی رو بنویس (مخفی نمیشه): ', async (enteredPassword) => {
        const isValid = await bcrypt.compare(enteredPassword, user.password);
        
        if (isValid) {
            console.log('\n✅✅✅ درسته! رمز جدیدت توی دیتابیس ذخیره شده! ✅✅✅');
            console.log(`📞 شماره موبایل: ${user.phone}`);
            console.log(`🔑 رمز شما: ${enteredPassword}`);
            console.log('\n💡 حالا با همین رمز لاگین کن!');
        } else {
            console.log('\n❌ رمز جدیدت در دیتابیس ذخیره نشده!');
            console.log('💡 باید دوباره فرآیند تغییر رمز رو انجام بدی.');
            
            // پیشنهاد: رمز رو به 12345678 ریست کن
            console.log('\n🔧 پیشنهاد: میخوای رمز رو به 12345678 ریست کنم؟ (y/n)');
            rl.question('', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    const bcrypt = require('bcrypt');
                    const { saveDatabase } = require('./config/database');
                    const hashed = await bcrypt.hash('12345678', 12);
                    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
                    updateStmt.run([hashed, user.id]);
                    updateStmt.free();
                    saveDatabase();
                    console.log('✅ رمز به 12345678 تغییر کرد! حالا با این رمز وارد شو.');
                }
                rl.close();
            });
            return;
        }
        rl.close();
    });
}

checkMyPassword();