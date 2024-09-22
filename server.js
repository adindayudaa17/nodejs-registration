const http = require("http");
const app = require('./app');
const connectDB = require('./config/db');

const server = http.createServer(app);

// Koneksi ke MongoDB
connectDB();

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
