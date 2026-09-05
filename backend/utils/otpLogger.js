// ============================================
// 🔥 نسخه خفن OTP Logger با افکت‌های بصری
// ============================================

const chalk = require('chalk'); // npm install chalk
const figlet = require('figlet'); // npm install figlet

const logOTP = (phone, type, otpCode, expiresIn = 120) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('fa-IR');
  const date = now.toLocaleDateString('fa-IR');
  
  // 🎨 رنگ‌های جذاب
  const colors = {
    primary: chalk.hex('#FF6B6B'),
    secondary: chalk.hex('#4ECDC4'),
    accent: chalk.hex('#FFE66D'),
    success: chalk.hex('#06D6A0'),
    warning: chalk.hex('#FFD166'),
    error: chalk.hex('#EF476F'),
    purple: chalk.hex('#9B5DE5'),
    pink: chalk.hex('#F15BB5')
  };
  
  // 📦 ساخت باکس
  const boxWidth = 70;
  const border = colors.primary('╔' + '═'.repeat(boxWidth) + '╗');
  const bottomBorder = colors.primary('╚' + '═'.repeat(boxWidth) + '╝');
  
  // 🚀 لوگوی OTP
  const otpArt = figlet.textSync('OTP', { font: 'Slant', horizontalLayout: 'full' });
  
  console.log('\n' + colors.purple(otpArt));
  console.log(border);
  console.log(colors.primary('║') + colors.accent(' 📱 درخواست کد تایید جدید ') + ' '.repeat(boxWidth - 27) + colors.primary('║'));
  console.log(colors.primary('╠' + '═'.repeat(boxWidth) + '╣'));
  
  // اطلاعات اصلی با فرمت جدول
  console.log(colors.primary('║') + ' ' + colors.secondary('⏰ زمان:') + ' ' + colors.white(timestamp) + ' ' + colors.secondary('📅 تاریخ:') + ' ' + colors.white(date) + ' '.repeat(boxWidth - 48) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.secondary('📞 شماره:') + ' ' + colors.warning(phone) + ' '.repeat(boxWidth - 18 - phone.length) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.secondary('🏷️ نوع:') + ' ' + colors.pink(type.toUpperCase()) + ' '.repeat(boxWidth - 16 - type.length) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.secondary('⏱️ انقضا:') + ' ' + colors.warning(`${expiresIn} ثانیه`) + ' '.repeat(boxWidth - 21) + colors.primary('║'));
  
  // نمایش کد OTP با افکت بزرگ
  console.log(colors.primary('╠' + '═'.repeat(boxWidth) + '╣'));
  console.log(colors.primary('║') + colors.success(' 🎯 کد تایید شما: ') + ' '.repeat(boxWidth - 27) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.accent.bold('┌' + '─'.repeat(otpCode.toString().length + 6) + '┐') + ' '.repeat(boxWidth - otpCode.toString().length - 12) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.accent.bold('│  ') + colors.success.bold.bgBlack(` ${otpCode} `) + colors.accent.bold('  │') + ' '.repeat(boxWidth - otpCode.toString().length - 12) + colors.primary('║'));
  console.log(colors.primary('║') + ' ' + colors.accent.bold('└' + '─'.repeat(otpCode.toString().length + 6) + '┘') + ' '.repeat(boxWidth - otpCode.toString().length - 12) + colors.primary('║'));
  
  // نوار پیشرفت انقضا (شبیه‌سازی)
  console.log(colors.primary('╠' + '═'.repeat(boxWidth) + '╣'));
  const progressBarLength = 40;
  const progress = '█'.repeat(progressBarLength);
  console.log(colors.primary('║') + ' ' + colors.warning(`⏳ انقضا: [${progress}] ${expiresIn}s`) + ' '.repeat(boxWidth - 31 - progressBarLength) + colors.primary('║'));
  
  console.log(bottomBorder);
  
  // 🎵 افکت صوتی (اختیاری - فقط در ترمینال‌های خاص)
  // process.stdout.write('\x07'); // بوق
  
  // 📊 آمار لحظه‌ای
  if (!global.otpStats) global.otpStats = { total: 0, byType: {} };
  global.otpStats.total++;
  global.otpStats.byType[type] = (global.otpStats.byType[type] || 0) + 1;
  
  console.log(colors.purple(`\n📊 آمار OTP تا الان: ${global.otpStats.total} عدد | `) + 
    Object.entries(global.otpStats.byType).map(([t, c]) => `${colors.pink(t)}:${colors.success(c)}`).join(' | '));
  
  console.log(colors.secondary('\n💡 نکته: برای تست سریع از کد زیر استفاده کنید:'));
  console.log(colors.white(`   curl -X POST http://localhost:3000/api/v1/auth/verify-otp \\`));
  console.log(colors.white(`     -H "Content-Type: application/json" \\`));
  console.log(colors.white(`     -d '{"phone":"${phone}","code":"${otpCode}","type":"${type}"}'`));
  
  console.log(colors.error('\n⚠️  هرگز این کد را با کسی به اشتراک نگذارید!\n'));
};

// 🔥 نسخه فوق‌العاده با Emoji و انیمیشن
const logOTPUltra = (phone, type, otpCode) => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ارسال OTP به ${phone}... `);
    i = (i + 1) % frames.length;
  }, 80);
  
  setTimeout(() => {
    clearInterval(interval);
    process.stdout.write('\r✅ ');
    logOTP(phone, type, otpCode);
  }, 1500);
};

// 🚀 نسخه با ذخیره در فایل JSON
const logOTPWithFile = (phone, type, otpCode) => {
  // لاگ معمولی
  logOTP(phone, type, otpCode);
  
  // ذخیره در فایل
  const otpLogFile = path.join(__dirname, '../logs/otp-history.json');
  const otpRecord = {
    phone,
    type,
    code: otpCode,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 120000).toISOString()
  };
  
  let history = [];
  if (fs.existsSync(otpLogFile)) {
    history = JSON.parse(fs.readFileSync(otpLogFile));
  }
  history.push(otpRecord);
  fs.writeFileSync(otpLogFile, JSON.stringify(history, null, 2));
  
  console.log(chalk.cyan(`💾 OTP ذخیره شد در: logs/otp-history.json`));
};

// 🎯 یک خطی خفن برای استفاده سریع
const quickLog = (phone, type, code) => {
  console.log(`
${chalk.bgRed.white(' 🔐 OTP 🔐 ')} ${chalk.yellow('='.repeat(50))}
${chalk.green('✓')} ${chalk.cyan('شماره:')} ${chalk.white(phone)}
${chalk.green('✓')} ${chalk.cyan('نوع:')} ${chalk.magenta(type)}
${chalk.green('✓')} ${chalk.cyan('کد:')} ${chalk.bgBlack.yellow.bold(` ${code} `)}
${chalk.green('✓')} ${chalk.cyan('انقضا:')} ${chalk.red('2 دقیقه')}
${chalk.yellow('='.repeat(60))}
  `);
};

// ============================================
// 📤 صادر کردن
// ============================================
module.exports = { logOTP, logOTPUltra, logOTPWithFile, quickLog };