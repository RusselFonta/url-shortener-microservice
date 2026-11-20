import logger from "../config/logger.js";

const error_handle = (err, req, res, _next) => {
  const status_code = err.statusCode || 500;

  logger.error({
    message: err.message,
    status: status_code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(status_code).json({
    status: "failed",
    message:
      status_code === 500 ? "An internal server error occurred" : err.message,
  });
};

export default error_handle;
