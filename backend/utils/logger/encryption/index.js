const CryptoJS = require("crypto-js");

const SECRET = process.env.LOG_SECRET || "dev-secret";

function encryptLog(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
}

function decryptLog(cipher) {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

module.exports = { encryptLog, decryptLog };
