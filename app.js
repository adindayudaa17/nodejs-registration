require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const cors = require("cors");

const app = express();

// CORS configuration
const allowed_url = process.env.FE_URL.split(",");
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowed_url.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

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
