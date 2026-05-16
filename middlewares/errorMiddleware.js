/**
 * Global Error Handler
 * Strictly NO fabricated data
 */
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const code = err.code || (err.response ? 'API_FAILURE' : 'INTERNAL_ERROR');
    const message = err.message || 'An unexpected error occurred';

    console.error(`[SYSTEM ERROR] ${code}: ${message}`);

    res.status(status).json({
        status: 'error',
        message,
        code
    });
};

module.exports = errorHandler;
