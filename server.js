require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // fixes Node's SRV DNS resolution on some Windows setups
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ---- Global middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json()); // parses incoming JSON request bodies into req.body
app.use(express.urlencoded({ extended: true }));

// Morgan logs every incoming request to the console (method, url, status, response time)
// "dev" format is colored and short — good for development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- Health check (useful for confirming deployment works) ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SplitSquare API is running" });
});

// ---- Routes ----
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/settlements", require("./routes/settlementRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// ---- Error handling (must be registered LAST) ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
