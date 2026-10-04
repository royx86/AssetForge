const mongoose = require('mongoose');
const Project = require('../models/Project');
const Asset = require('../models/Asset');
const ApiLog = require('../models/ApiLog');

class UsageService {
  async getProjectUsage(userId, projectId) {
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

    const [assetsCount, storageAgg, apiRequestsCount, transformsCount] = await Promise.all([
      Asset.countDocuments({ projectId: project._id }),
      Asset.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]),
      ApiLog.countDocuments({ projectId: project._id }),
      ApiLog.countDocuments({
        projectId: project._id,
        endpoint: { $regex: /transform/i }
      })
    ]);

    const storageBytes = storageAgg.length > 0 ? storageAgg[0].totalSize : 0;

    return {
      assets: assetsCount,
      storageBytes,
      transformations: transformsCount,
      apiRequests: apiRequestsCount
    };
  }
}

module.exports = new UsageService();
