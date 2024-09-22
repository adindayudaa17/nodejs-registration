require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const cors = require("cors");

const app = express();

const allowed_url = process.env.FE_URL.split(",");
app.use(cors({ origin: allowed_url }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware untuk parsing JSON
app.use(express.json());

// Rute API
app.use("/api/user", userRoutes);

// Middleware untuk menangani error
app.use(errorHandler);

module.exports = app;
