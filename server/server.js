const express = require("express");
const http = require("http");
const db = require("./db"); // Import MySQL connection
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

app.get("/api", (req, res) => {
  res.json({ users: ["userone", "usertwo", "userthree", "userfour"] });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  sendVarUpdates(socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const sendVarUpdates = async (socket) => {
  let lastTimestamp = null;

  const checkForUpdates = async () => {
    try {
      // Get the most recent entry
      const [latestRow] = await db.query(
        "SELECT calculation_time FROM value_at_risk ORDER BY calculation_time DESC LIMIT 1"
      );

      if (latestRow.length === 0) return; // No data in table yet

      const newTimestamp = latestRow[0].calculation_time;

      // If there is a new record, fetch and emit updated table
      if (!lastTimestamp || newTimestamp > lastTimestamp) {
        lastTimestamp = newTimestamp;
        const [tableData] = await db.query(
          "SELECT * FROM value_at_risk WHERE calculation_time >= (CASE WHEN TIME(NOW()) >= '08:30:00' THEN DATE(NOW()) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE ELSE DATE(NOW() - INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE END) ORDER BY calculation_time;"
          //"SELECT * FROM value_at_risk WHERE DATE(calculation_time) = '2025-03-20';"
        );
        io.emit("updateTable", tableData); // Broadcast update
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    // Schedule next check
    setTimeout(checkForUpdates, 1000); // Every second or as needed
  };

  checkForUpdates(); // Start the update loop
};

server.listen(5000, () => {
  console.log("Server started on port 5000");
});
