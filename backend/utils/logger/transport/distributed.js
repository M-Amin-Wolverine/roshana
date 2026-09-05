function distributedLog(service, payload) {
  console.log(`[${service}]`, JSON.stringify(payload));
  // later: send to kafka / redis / http collector
}

module.exports = distributedLog;
