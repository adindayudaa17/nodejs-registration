require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.FE_URL }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Middleware untuk parsing JSON
app.use(express.json());

// Rute API
app.use('/api/user', userRoutes);

// Middleware untuk menangani error
app.use(errorHandler);

module.exports = app;
