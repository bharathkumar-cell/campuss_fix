const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { initSocket } = require('./sockets/complaintSocket');

// Initialize database connection
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});
initSocket(io);

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Frontend Statically
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'College Complaint Management System API',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 College Complaint Management Server running on port ${PORT}`);
  console.log(`🌐 Local Application URL: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-time service initialized`);
  console.log(`====================================================`);
});
