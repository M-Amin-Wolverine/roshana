const profileService = require('./services/profile.service');
const verificationService = require('./services/verification.service');
const socialService = require('./services/social.service');
const preferenceService = require('./services/preference.service');
const dataService = require('./services/data.service');
const uploadService = require('./services/upload.service');
const securityService = require('./services/security.service');
const sessionService = require('./services/session.service');

module.exports = {

    getProfile: profileService.getProfile,
    getPublicProfile: profileService.getPublicProfile,
    updateProfile: profileService.updateProfile,
    changeUsername: profileService.changeUsername,

    changeEmail: verificationService.changeEmail,
    changePhone: verificationService.changePhone,

    uploadAvatar: uploadService.uploadAvatar,
    removeAvatar: uploadService.removeAvatar,
    uploadCover: uploadService.uploadCover,
    removeCover: uploadService.removeCover,

    changePassword: securityService.changePassword,

    getSessions: sessionService.getSessions,
    terminateSession: sessionService.terminateSession,
    logoutAllDevices: sessionService.logoutAllDevices,

    getSettings: preferenceService.getSettings,
    updateSettings: preferenceService.updateSettings,

    getFollowers: socialService.getFollowers,
    getFollowing: socialService.getFollowing,
    followUser: socialService.followUser,
    unfollowUser: socialService.unfollowUser,

    exportData: dataService.exportData,
    importData: dataService.importData
};
