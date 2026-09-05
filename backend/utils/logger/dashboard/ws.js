const WebSocket = require("ws");

function startDashboard(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ status: "logger connected" }));
  });

  return wss;
}

module.exports = startDashboard;
