const assetService = require('../services/asset.service');
const Project = require('../models/Project');
const { successResponse } = require('../utils/response');

class AssetController {
  // Helper to extract effective projectId and verify project access if authenticated
  async getEffectiveProjectId(req) {
    if (req.project && req.project._id) {
      return req.project._id;
    }

    if (req.params.projectId) {
      const { projectId } = req.params;
      if (req.user) {
        const project = await Project.findOne({ _id: projectId, userId: req.user._id });
        if (!project) {
          const error = new Error('Project not found or unauthorized');
          error.statusCode = 404;
          throw error;
        }
      }
      return projectId;
    }

    return null;
  }

  /**
   * Upload and process an image
   * POST /api/assets
   * POST /api/projects/:projectId/assets
   * POST /api/v1/assets
   */
  async uploadAsset(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const data = await assetService.uploadAsset({
        file: req.file,
        body: req.body,
        projectId
      });
      return successResponse(res, 201, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single asset by ID
   * GET /api/assets/:id
   * GET /api/projects/:projectId/assets/:id
   * GET /api/v1/assets/:id
   */
  async getAsset(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const data = await assetService.getAssetById(req.params.id, projectId);
      return successResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dynamic image transformation
   * POST /api/assets/:id/transform
   * POST /api/projects/:projectId/assets/:id/transform
   * POST /api/v1/assets/:id/transform
   */
  async transformAsset(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const data = await assetService.transformAsset(req.params.id, req.body, projectId);
      return successResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List assets with pagination and filters
   * GET /api/assets
   * GET /api/projects/:projectId/assets
   * GET /api/v1/assets
   */
  async listAssets(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const { page, limit, folder, tag, visibility, search } = req.query;

      const result = await assetService.listAssets({
        projectId,
        page,
        limit,
        folder,
        tag,
        visibility,
        search
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete asset and all associated files from S3
   * DELETE /api/assets/:id
   * DELETE /api/projects/:projectId/assets/:id
   * DELETE /api/v1/assets/:id
   */
  async deleteAsset(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const result = await assetService.deleteAsset(req.params.id, projectId);
      return successResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate temporary pre-signed URL for an asset
   * GET /api/assets/:id/url
   * GET /api/projects/:projectId/assets/:id/url
   * GET /api/v1/assets/:id/url
   */
  async getSignedAssetUrl(req, res, next) {
    try {
      const projectId = await this.getEffectiveProjectId(req);
      const { variant, expiresIn } = req.query;
      const data = await assetService.getSignedAssetUrl(req.params.id, variant, expiresIn, projectId);
      return successResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
