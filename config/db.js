const mongoose = require("mongoose");

// Connects to MongoDB Atlas using the URI from .env
// Called once when the server starts (see server.js)
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // stop the server if DB connection fails — no point running without a DB
  }
};

module.exports = connectDB;
