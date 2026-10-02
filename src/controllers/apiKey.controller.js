const apiKeyService = require('../services/apiKey.service');
const { successResponse } = require('../utils/response');

class ApiKeyController {
  async createApiKey(req, res, next) {
    try {
      const { projectId } = req.params;
      const { name } = req.body;
      const result = await apiKeyService.createApiKey(req.user._id, projectId, name);
      return successResponse(res, 201, result);
    } catch (error) {
      next(error);
    }
  }

  async getApiKeys(req, res, next) {
    try {
      const { projectId } = req.params;
      const keys = await apiKeyService.getApiKeys(req.user._id, projectId);
      return successResponse(res, 200, keys);
    } catch (error) {
      next(error);
    }
  }

  async deleteApiKey(req, res, next) {
    try {
      const { projectId, id } = req.params;
      const result = await apiKeyService.deleteApiKey(req.user._id, projectId, id);
      return successResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApiKeyController();
