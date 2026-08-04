const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} on this server.`, 404));
};

module.exports = notFound;
