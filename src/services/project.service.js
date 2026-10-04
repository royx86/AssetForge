const mongoose = require('mongoose');
const Project = require('../models/Project');
const Asset = require('../models/Asset');
const ApiKey = require('../models/ApiKey');
const ApiLog = require('../models/ApiLog');
const storageService = require('./storage.service');

class ProjectService {
  async createProject(userId, { name, description }) {
    if (!name || !name.trim()) {
      const error = new Error('Project name is required');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      userId
    });

    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      assetsCount: 0,
      storageBytes: 0
    };
  }

  async getProjectsByUser(userId) {
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });

    if (projects.length === 0) {
      return [];
    }

    const projectIds = projects.map((p) => p._id);

    // Aggregate asset counts and storage sizes per project
    const stats = await Asset.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          assetsCount: { $sum: 1 },
          storageBytes: { $sum: '$size' }
        }
      }
    ]);

    const statsMap = new Map();
    for (const item of stats) {
      statsMap.set(item._id.toString(), {
        assetsCount: item.assetsCount,
        storageBytes: item.storageBytes
      });
    }

    return projects.map((proj) => {
      const idStr = proj._id.toString();
      const projectStats = statsMap.get(idStr) || { assetsCount: 0, storageBytes: 0 };
      return {
        id: idStr,
        name: proj.name,
        description: proj.description,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
        assetsCount: projectStats.assetsCount,
        storageBytes: projectStats.storageBytes
      };
    });
  }

  async getProjectById(userId, projectId) {
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

    const [assetsCount, storageAgg] = await Promise.all([
      Asset.countDocuments({ projectId: project._id }),
      Asset.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    const storageBytes = storageAgg.length > 0 ? storageAgg[0].totalSize : 0;

    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      assetsCount,
      storageBytes
    };
  }

  async updateProject(userId, projectId, { name, description }) {
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

    if (name && name.trim()) {
      project.name = name.trim();
    }
    if (description !== undefined) {
      project.description = description.trim();
    }

    await project.save();

    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  async deleteProject(userId, projectId) {
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

    // 1. Find all assets for this project and clean up from S3
    const assets = await Asset.find({ projectId: project._id });
    const s3KeysToDelete = [];

    for (const asset of assets) {
      if (asset.originalKey) s3KeysToDelete.push(asset.originalKey);
      if (asset.variants?.webp?.key) s3KeysToDelete.push(asset.variants.webp.key);
      if (asset.variants?.avif?.key) s3KeysToDelete.push(asset.variants.avif.key);
      if (asset.variants?.thumbnail?.key) s3KeysToDelete.push(asset.variants.thumbnail.key);
      for (const transformed of asset.transformed || []) {
        if (transformed.key) s3KeysToDelete.push(transformed.key);
      }
    }

    if (s3KeysToDelete.length > 0) {
      await storageService.deleteMany(s3KeysToDelete);
    }

    // 2. Delete related documents from MongoDB
    await Promise.all([
      Asset.deleteMany({ projectId: project._id }),
      ApiKey.deleteMany({ projectId: project._id }),
      ApiLog.deleteMany({ projectId: project._id }),
      Project.deleteOne({ _id: project._id })
    ]);

    return { message: 'Project and all associated assets, keys, and logs deleted successfully' };
  }
}

module.exports = new ProjectService();
