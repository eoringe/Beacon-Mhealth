const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Firebase auth errors
    if (err.code && err.code.startsWith('auth/')) {
        return res.status(401).json({
            error: 'Authentication error',
            message: err.message
        });
    }

    // Database errors
    if (err.code && err.code.startsWith('23')) {
        return res.status(400).json({
            error: 'Database error',
            message: 'Data constraint violation'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: err.message
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
