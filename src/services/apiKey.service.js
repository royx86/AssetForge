const mongoose = require('mongoose');
const Project = require('../models/Project');
const ApiKey = require('../models/ApiKey');
const { generateApiKey } = require('../utils/generateApiKey');

class ApiKeyService {
  async verifyProjectOwnership(userId, projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      const error = new Error('Project not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    return project;
  }

  async createApiKey(userId, projectId, name) {
    await this.verifyProjectOwnership(userId, projectId);

    if (!name || !name.trim()) {
      const error = new Error('API key name is required (e.g., Production, Staging)');
      error.statusCode = 400;
      throw error;
    }

    const { rawKey, keyHash, maskedKey } = generateApiKey('live');

    const apiKey = await ApiKey.create({
      name: name.trim(),
      projectId,
      maskedKey,
      keyHash
    });

    return {
      apiKey: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        maskedKey: apiKey.maskedKey,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt
      },
      rawKey
    };
  }

  async getApiKeys(userId, projectId) {
    await this.verifyProjectOwnership(userId, projectId);

    const keys = await ApiKey.find({ projectId }).sort({ createdAt: -1 });

    return keys.map((k) => ({
      id: k._id.toString(),
      name: k.name,
      maskedKey: k.maskedKey,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt
    }));
  }

  async deleteApiKey(userId, projectId, apiKeyId) {
    await this.verifyProjectOwnership(userId, projectId);

    if (!mongoose.Types.ObjectId.isValid(apiKeyId)) {
      const error = new Error('API key not found');
      error.statusCode = 404;
      throw error;
    }

    const key = await ApiKey.findOneAndDelete({ _id: apiKeyId, projectId });
    if (!key) {
      const error = new Error('API key not found');
      error.statusCode = 404;
      throw error;
    }

    return { message: 'API key revoked successfully', id: apiKeyId };
  }
}

module.exports = new ApiKeyService();
