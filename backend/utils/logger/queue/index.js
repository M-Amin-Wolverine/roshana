const buffer = [];

function pushLog(log) {
  buffer.push(log);
  if (buffer.length > 100) buffer.shift();
}

function flushLogs() {
  return buffer.splice(0, buffer.length);
}

module.exports = { pushLog, flushLogs };
