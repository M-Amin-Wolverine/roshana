// ============================================
// 📧 Advanced Email Templates System
// ============================================

const BRAND = {
    appName: 'Roshana',
    support: 'support@roshana.ir',
    website: 'https://roshana.ir',
    logo: 'https://roshana.ir/logo.png',
    copyright: `© ${new Date().getFullYear()} Roshana. All rights reserved.`
};

const createLayout = ({
    title,
    content,
    footer = true,
    lang = 'fa',
    direction = 'rtl'
}) => `
<!DOCTYPE html>
<html lang="${lang}" dir="${direction}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>

<style>
body{
    margin:0;
    padding:0;
    background:#0f172a;
    font-family:Tahoma,sans-serif;
    color:#e2e8f0;
}
.wrapper{
    width:100%;
    padding:40px 0;
}
.container{
    max-width:650px;
    margin:auto;
    background:#111827;
    border-radius:18px;
    overflow:hidden;
    border:1px solid #1e293b;
}
.header{
    background:linear-gradient(135deg,#2563eb,#7c3aed);
    padding:35px;
    text-align:center;
}
.logo{
    width:70px;
    margin-bottom:15px;
}
.title{
    font-size:28px;
    font-weight:bold;
}
.content{
    padding:40px;
    line-height:2;
    font-size:15px;
}
.button{
    display:inline-block;
    padding:14px 28px;
    background:#2563eb;
    color:white !important;
    border-radius:10px;
    text-decoration:none;
    margin-top:20px;
    font-weight:bold;
}
.card{
    background:#1e293b;
    padding:20px;
    border-radius:12px;
    margin:20px 0;
}
.footer{
    padding:25px;
    text-align:center;
    font-size:13px;
    color:#94a3b8;
    border-top:1px solid #1e293b;
}
.code{
    background:#0f172a;
    padding:16px;
    border-radius:12px;
    text-align:center;
    font-size:26px;
    letter-spacing:6px;
    font-weight:bold;
    margin:20px 0;
}
.warning{
    color:#f59e0b;
}
.success{
    color:#10b981;
}
.danger{
    color:#ef4444;
}
</style>
</head>

<body>
<div class="wrapper">
<div class="container">

<div class="header">
    <img class="logo" src="${BRAND.logo}" />
    <div class="title">${title}</div>
</div>

<div class="content">
${content}
</div>

${
footer
? `
<div class="footer">
    <div>${BRAND.copyright}</div>
    <div>${BRAND.website}</div>
    <div>${BRAND.support}</div>
</div>
`
: ''
}

</div>
</div>
</body>
</html>
`;

const EmailTemplates = {

    // ============================================
    // 🔐 Verify Email
    // ============================================
    verifyEmail({
        name,
        code,
        verifyUrl,
        expire = '10 دقیقه'
    }) {
        return createLayout({
            title: 'تایید ایمیل',
            content: `
                <h2>سلام ${name} 👋</h2>

                <p>
                    برای تکمیل ثبت‌نام در سیستم روشنا،
                    کد زیر را وارد کنید:
                </p>

                <div class="code">${code}</div>

                <p class="warning">
                    اعتبار کد: ${expire}
                </p>

                <a class="button" href="${verifyUrl}">
                    تایید حساب
                </a>
            `
        });
    },

    // ============================================
    // 🔑 Reset Password
    // ============================================
    resetPassword({
        name,
        resetUrl,
        ip,
        device
    }) {
        return createLayout({
            title: 'بازیابی رمز عبور',
            content: `
                <h2>درخواست بازیابی رمز 🔐</h2>

                <p>
                    ${name} عزیز،
                    درخواست تغییر رمز عبور برای حساب شما ثبت شد.
                </p>

                <div class="card">
                    <b>IP:</b> ${ip}<br/>
                    <b>Device:</b> ${device}
                </div>

                <a class="button" href="${resetUrl}">
                    تغییر رمز عبور
                </a>

                <p class="danger">
                    اگر این درخواست توسط شما نبوده،
                    سریعاً رمز خود را تغییر دهید.
                </p>
            `
        });
    },

    // ============================================
    // 🎉 Welcome
    // ============================================
    welcome({
        name,
        role
    }) {
        return createLayout({
            title: 'خوش آمدید به روشنا ✨',
            content: `
                <h2>سلام ${name} 🌟</h2>

                <p>
                    حساب کاربری شما با موفقیت ایجاد شد.
                </p>

                <div class="card">
                    <b>نقش شما:</b> ${role}
                </div>

                <p class="success">
                    اکنون می‌توانید از تمام امکانات سیستم استفاده کنید.
                </p>

                <a class="button" href="${BRAND.website}">
                    ورود به پنل
                </a>
            `
        });
    },

    // ============================================
    // ⚠️ Security Alert
    // ============================================
    securityAlert({
        name,
        action,
        location,
        time
    }) {
        return createLayout({
            title: 'هشدار امنیتی 🚨',
            content: `
                <h2 class="danger">
                    فعالیت مشکوک شناسایی شد
                </h2>

                <div class="card">
                    <b>عملیات:</b> ${action}<br/>
                    <b>مکان:</b> ${location}<br/>
                    <b>زمان:</b> ${time}
                </div>

                <p>
                    اگر این فعالیت توسط شما انجام نشده،
                    سریعاً حساب خود را ایمن کنید.
                </p>
            `
        });
    },

    // ============================================
    // 📦 Generic Notification
    // ============================================
    notification({
        title,
        message,
        buttonText,
        buttonUrl
    }) {
        return createLayout({
            title,
            content: `
                <p>${message}</p>

                ${
                    buttonUrl
                    ? `<a class="button" href="${buttonUrl}">
                        ${buttonText || 'مشاهده'}
                       </a>`
                    : ''
                }
            `
        });
    }
};

module.exports = EmailTemplates;