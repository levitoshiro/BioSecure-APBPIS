require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Compliance Ledger
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Compliance Ledger'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('BioSecure Enterprise AI Backend is running.');
});

// API Routes
const aiReportRoutes = require('./routes/aiReport');
app.use('/api', aiReportRoutes);

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Enterprise AI Node Server running on http://localhost:${PORT}`);
});