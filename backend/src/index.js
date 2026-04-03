require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const {
    helmetConfig,
    generalLimiter,
    authLimiter,
    mediaLimiter,
    compressionConfig,
    sanitizeInput,
    requestLogger
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const childRoutes = require('./routes/children');
const milestoneRoutes = require('./routes/milestones');
const appointmentRoutes = require('./routes/appointments');
const growthRoutes = require('./routes/growth');
const patientRoutes = require('./routes/patients');
const mediaRoutes = require('./routes/media');
const doctorRoutes = require('./routes/doctors');
const syncRoutes = require('./routes/sync');
const mpesaRoutes = require('./routes/mpesa');
const publicRoutes = require('./routes/public');
const asdRoutes = require('./routes/asdRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// SECURITY MIDDLEWARE (Applied First)
// ========================================
app.use(helmetConfig);           // Security headers
app.use(compressionConfig);      // Gzip compression
app.use(requestLogger);          // Request logging

// ========================================
// PARSING MIDDLEWARE
// ========================================
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));  // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);          // XSS protection

// ========================================
// RATE LIMITING (Applied Before Routes)
// ========================================
app.use('/api/auth', authLimiter);     // Stricter for auth
app.use('/api/media/download', mediaLimiter);  // Limit downloads
app.use('/api', generalLimiter);       // General API limit

// ========================================
// HEALTH CHECK (No rate limit)
// ========================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

// ========================================
// API ROUTES
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/asd', asdRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;

