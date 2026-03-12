/**
 * Security Middleware
 * Production-ready security configuration for 100k+ users
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

/**
 * Helmet Configuration
 * Sets secure HTTP headers to prevent common attacks
 * Note: CSP disabled for API-only backend (no HTML served)
 */
const helmetConfig = helmet({
    contentSecurityPolicy: false,  // Disable CSP for API endpoints
    crossOriginEmbedderPolicy: false, // For mobile app compatibility
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin requests
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Rate Limiting - General API
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
    message: {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Use default keyGenerator which handles IPv6 properly
    validate: { xForwardedForHeader: false } // Disable validation warning for proxied requests
});

/**
 * Rate Limiting - Auth Routes (stricter)
 * 20 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Stricter limit for auth endpoints
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate Limiting - Media Downloads
 * 50 downloads per hour per IP
 */
const mediaLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: {
        error: 'Download limit exceeded',
        message: 'Please try again later'
    }
});

/**
 * Compression Middleware
 * Compresses responses above 1KB
 */
const compressionConfig = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6 // Balanced compression (1-9)
});

/**
 * Request Sanitization
 * Strips dangerous characters from inputs
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove script tags and encoded variants
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);

    next();
};

/**
 * Request Logger for Production
 * Logs request metadata for debugging and analytics
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        // Only log slow requests (>1s) or errors in production
        if (process.env.NODE_ENV === 'production') {
            if (duration > 1000 || res.statusCode >= 400) {
                console.log({
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']?.substring(0, 50)
                });
            }
        } else {
            // Log all requests in development
            console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
        }
    });

    next();
};

module.exports = {
    helmetConfig,
    generalLimiter,
    authLimiter,
    mediaLimiter,
    compressionConfig,
    sanitizeInput,
    requestLogger
};
