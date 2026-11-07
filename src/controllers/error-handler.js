import logger from "../config/logger";

const error_handle = (err, req, res, next) => {
    const status_code = err.statusCode

    logger.error({
        Message: err.Message,
        Status: err.statusCode,
        stack: err.stack,
        url: err.url
    })

    res.status(status_code).json({
        message: err.message,
        status: status_code,

    })

}

export default error_handle