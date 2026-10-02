function successResponse(res, statusCode, data, extra = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...extra
  });
}

function errorResponse(res, statusCode, message, details = null) {
  const payload = {
    success: false,
    error: {
      message
    }
  };
  if (details) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
