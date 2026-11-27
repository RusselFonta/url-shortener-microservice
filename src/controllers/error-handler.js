import logger from "../config/logger.js";

const error_handle = (err, req, res, _next) => {
  const status_code = err.statusCode || err.status || 500;

  const invalid_json = err.type === "entity.parse.failed";

  logger.error({
    message: err.message,
    status: status_code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(invalid_json ? 400 : status_code).json({
    status: "failed",
    message: invalid_json
      ? "Invalid JSON format"
      : status_code === 500
        ? "An internal server error occurred"
        : err.message,
  });
};

export default error_handle;