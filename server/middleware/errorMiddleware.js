const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An unexpected server error occurred.';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format.';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'record';
    message = `A record with that ${field} already exists.`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map(val => val.message)
      .join(', ');
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size (15 MB).';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  if (statusCode >= 500) {
    console.error('[ServerError]', err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again later.'
      : message
  });
};

module.exports = {
  notFound,
  errorHandler
};

