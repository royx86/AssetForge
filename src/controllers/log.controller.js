const mongoose = require('mongoose');
const Project = require('../models/Project');
const ApiLog = require('../models/ApiLog');
const { successResponse } = require('../utils/response');

class LogController {
  async getLogs(req, res, next) {
    try {
      const { projectId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
      }

      const project = await Project.findOne({ _id: projectId, userId: req.user._id });
      if (!project) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = { projectId: project._id };

      if (req.query.method) {
        filter.method = req.query.method.toUpperCase();
      }
      if (req.query.statusCode) {
        filter.statusCode = parseInt(req.query.statusCode, 10);
      }

      const [logs, total] = await Promise.all([
        ApiLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('apiKeyId', 'name maskedKey'),
        ApiLog.countDocuments(filter)
      ]);

      const formattedLogs = logs.map((log) => ({
        id: log._id.toString(),
        method: log.method,
        endpoint: log.endpoint,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        createdAt: log.createdAt,
        apiKey: log.apiKeyId
          ? {
              id: log.apiKeyId._id.toString(),
              name: log.apiKeyId.name,
              maskedKey: log.apiKeyId.maskedKey
            }
          : null
      }));

      const pages = Math.ceil(total / limit) || 1;

      return successResponse(res, 200, formattedLogs, {
        pagination: {
          page,
          limit,
          total,
          pages
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LogController();
