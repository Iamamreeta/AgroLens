const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.detail?.match(/\(([^)]+)\)=\(([^)]+)\)/);
  const field = value?.[1] || 'field';
  const msg = value ? `Duplicate ${field} value: '${value[2]}'. Please use another value.` : 'Duplicate field value.';
  return new AppError(msg, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }
  console.error('[FATAL ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong'
  });
};

module.exports = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = err;

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.name === 'SequelizeUniqueConstraintError') error = handleDuplicateFieldsDB(error);
  if (error.name === 'SequelizeValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, res);
  }
};