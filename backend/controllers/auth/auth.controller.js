
const authService = require('./services/auth.service');
const otpService = require('./services/otp.service');
const tokenService = require('./services/token.service');
const profileService = require('./services/profile.service');
const passwordService = require('./services/password.service');

module.exports = {

    registerUltra: authService.registerUltra,

    loginUltra: authService.loginUltra,

    logoutUltra: authService.logoutUltra,

    sendOTPUltra: otpService.sendOTPUltra,

    verifyOTPUltra: otpService.verifyOTPUltra,

    refreshTokenUltra: tokenService.refreshTokenUltra,

    getProfileUltra: profileService.getProfileUltra,

    updateProfileUltra: profileService.updateProfileUltra,

    changePasswordUltra: passwordService.changePasswordUltra
};

