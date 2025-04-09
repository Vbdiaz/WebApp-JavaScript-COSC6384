const express = require("express");
const http = require("http");
const db = require("./db"); // Import MySQL connection
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.get("/api", (req, res) => {
  res.json({ users: ["userone", "usertwo", "userthree", "userfour"] });
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

// Create two separate namespaces
const montecarloNamespace = io.of('/montecarlo');
const historicalNamespace = io.of('/historical');
const portfolioNamespace = io.of('/portfolio');

montecarloNamespace.on("connection", (socket) => {
  console.log("Monte Carlo Client connected:", socket.id);
  sendMontecarloUpdate(socket);
  socket.on("disconnect", () => {
    console.log("Monte Carlo Client disconnected:", socket.id);
  });
});

historicalNamespace.on("connection", (socket) => {
  console.log("Historical Client connected:", socket.id);
  sendHistoricalUpdate(socket);
  socket.on("disconnect", () => {
    console.log("Historical Client disconnected:", socket.id);
  });
});

portfolioNamespace.on("connection", (socket) => {
  console.log("Portfolio Client connected:", socket.id);
  sendPortfolioUpdate(socket);
  socket.on("disconnect", () => {
    console.log("Portfolio Client disconnected:", socket.id);
  });
});

// 1. Monte Carlo Updates
const sendMontecarloUpdate = async (socket) => {
  let lastTimestamp = null;

  const checkForUpdates = async () => {
    try {
      const [latestRow] = await db.query(
        "SELECT calculation_time FROM value_at_risk WHERE method = 'monte_carlo' ORDER BY calculation_time DESC LIMIT 1"
      );

      if (latestRow.length === 0) return;

      const newTimestamp = latestRow[0].calculation_time;

      if (!lastTimestamp || newTimestamp > lastTimestamp) {
        lastTimestamp = newTimestamp;
        const [tableData] = await db.query(
          "SELECT *, TIME(calculation_time) AS time_only FROM value_at_risk WHERE DATE(calculation_time) = (SELECT MAX(DATE(calculation_time)) FROM value_at_risk  WHERE method = 'monte_carlo') AND method = 'monte_carlo' ORDER BY calculation_time DESC;"
        );
        socket.emit("updateMontecarlo", tableData);
        
        // Update portfolio table based on the new Monte Carlo or historical update
        // updatePortfolio();
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    setTimeout(checkForUpdates, 1000);
  };

  checkForUpdates();
};

// 2. Historical Updates
const sendHistoricalUpdate = async (socket) => {
  let lastTimestamp = null;

  const checkForUpdates = async () => {
    try {
      const [latestRow] = await db.query(
        "SELECT calculation_time FROM value_at_risk WHERE method = 'historical' ORDER BY calculation_time DESC LIMIT 1"
      );

      if (latestRow.length === 0) return;

      const newTimestamp = latestRow[0].update_time;

      if (!lastTimestamp || newTimestamp > lastTimestamp) {
        lastTimestamp = newTimestamp;
        const [tableData] = await db.query(
          "SELECT *, TIME(calculation_time) AS time_only FROM value_at_risk WHERE DATE(calculation_time) = (SELECT MAX(DATE(calculation_time)) FROM value_at_risk WHERE method = 'historical') AND method = 'historical' ORDER BY calculation_time DESC;"
        );
        socket.emit("updateHistorical", tableData);
        
        // Update portfolio table based on the new Monte Carlo or historical update
        // updatePortfolio();
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    setTimeout(checkForUpdates, 1000);
  };

  checkForUpdates();
};

// 3. Portfolio Updates
const sendPortfolioUpdate = async (socket) => {
  let lastTimestamp = null;

  const checkForUpdates = async () => {
    try {
      const [latestRow] = await db.query(
        "SELECT calculation_time FROM value_at_risk WHERE method = 'monte_carlo' ORDER BY calculation_time DESC LIMIT 1"
      );

      if (latestRow.length === 0) return;

      const newTimestamp = latestRow[0].update_time;

      if (!lastTimestamp || newTimestamp > lastTimestamp) {
        lastTimestamp = newTimestamp;
        const [portfolioData] = await db.query(
          "SELECT * FROM portfolio ORDER BY ticker ASC;"
        );
        const [VaRData] = await db.query(
          "SELECT *, TIME(calculation_time) AS time_only FROM value_at_risk WHERE DATE(calculation_time) = (SELECT MAX(DATE(calculation_time)) FROM value_at_risk  WHERE method = 'monte_carlo') AND method = 'monte_carlo' ORDER BY calculation_time ASC;"
        )
        socket.emit("updatePortfolio", {portfolioData, VaRData});
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    setTimeout(checkForUpdates, 1000);
  };

  checkForUpdates();
};


server.listen(5000, () => {
  console.log("Server started on port 5000");
});
