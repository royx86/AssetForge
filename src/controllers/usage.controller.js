const usageService = require('../services/usage.service');
const { successResponse } = require('../utils/response');

class UsageController {
  async getUsage(req, res, next) {
    try {
      const { projectId } = req.params;
      const usage = await usageService.getProjectUsage(req.user._id, projectId);
      return successResponse(res, 200, usage);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsageController();
