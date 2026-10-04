const ApiKey = require('../models/ApiKey');
const ApiLog = require('../models/ApiLog');
const { hashApiKey } = require('../utils/generateApiKey');
const { errorResponse } = require('../utils/response');

// In-memory rate limiting store: keyId -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests / min / API key

// Clean up expired buckets periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
cleanupInterval.unref();

async function apiKeyMiddleware(req, res, next) {
  const startTime = Date.now();

  try {
    let rawKey = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.split(' ')[1];
    } else if (req.headers['x-api-key']) {
      rawKey = req.headers['x-api-key'];
    }

    if (!rawKey) {
      return errorResponse(res, 401, 'API key required. Provide via Bearer token or x-api-key header');
    }

    const keyHash = hashApiKey(rawKey);
    const apiKey = await ApiKey.findOne({ keyHash }).populate('projectId');

    if (!apiKey || !apiKey.projectId) {
      return errorResponse(res, 401, 'Invalid or revoked API key');
    }

    // Rate Limiting
    const keyId = apiKey._id.toString();
    const now = Date.now();
    let rateData = rateLimitMap.get(keyId);

    if (!rateData || now > rateData.resetTime) {
      rateData = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      };
      rateLimitMap.set(keyId, rateData);
    } else {
      rateData.count += 1;
    }

    if (rateData.count > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too Many Requests. Rate limit of 100 requests per minute exceeded.'
        }
      });
    }

    req.apiKey = apiKey;
    req.project = apiKey.projectId;

    // Update lastUsedAt asynchronously
    ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch((err) => {
      console.error('[ApiKey] Failed to update lastUsedAt:', err.message);
    });

    // Log request on response finish
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      ApiLog.create({
        projectId: req.project._id,
        apiKeyId: apiKey._id,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime
      }).catch((logErr) => {
        console.error('[ApiLog] Failed to record API log:', logErr.message);
      });
    });

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = apiKeyMiddleware;
