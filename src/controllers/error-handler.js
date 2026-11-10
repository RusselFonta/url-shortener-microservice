import logger from "../config/logger.js";

const error_handle = (err, req, res, _next) => {
  const status_code = err.statusCode || 500;

  logger.error({
    Message: err.message,
    Status: err.statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(status_code).json({
    message: err.message,
    status: status_code,
  });
};

export default error_handle;
