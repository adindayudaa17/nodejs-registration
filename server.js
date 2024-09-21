const app = require('./app');
const connectDB = require('./config/db');

// Koneksi ke MongoDB
connectDB();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
