const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const storageService = require('../services/storage.service');
const imageService = require('../services/image.service');

/**
 * Helper to parse tags from string or array
 */
function parseTags(tagsInput) {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Format asset document into standard API response with URLs
 */
async function formatAssetResponse(asset) {
  const isPrivate = asset.visibility === 'private';

  const getUrl = async (key) => {
    if (!key) return null;
    if (isPrivate) {
      return storageService.generateSignedUrl(key, 3600);
    }
    return storageService.generateUrl(key);
  };

  const [originalUrl, webpUrl, avifUrl, thumbUrl] = await Promise.all([
    getUrl(asset.originalKey),
    getUrl(asset.variants?.webp?.key),
    getUrl(asset.variants?.avif?.key),
    getUrl(asset.variants?.thumbnail?.key)
  ]);

  return {
    id: asset._id.toString(),
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    size: asset.size,
    format: asset.format,
    folder: asset.folder,
    tags: asset.tags,
    visibility: asset.visibility,
    original: {
      key: asset.originalKey,
      url: originalUrl,
      width: asset.width,
      height: asset.height
    },
    webp: {
      key: asset.variants?.webp?.key,
      url: webpUrl,
      width: asset.variants?.webp?.width,
      height: asset.variants?.webp?.height
    },
    avif: {
      key: asset.variants?.avif?.key,
      url: avifUrl,
      width: asset.variants?.avif?.width,
      height: asset.variants?.avif?.height
    },
    thumbnail: {
      key: asset.variants?.thumbnail?.key,
      url: thumbUrl,
      width: asset.variants?.thumbnail?.width,
      height: asset.variants?.thumbnail?.height
    },
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt
  };
}

class AssetController {
  /**
   * Upload and process an image
   * POST /api/assets
   */
  async uploadAsset(req, res, next) {
    try {
      if (!req.file) {
        const error = new Error("Please provide an image file in the 'file' field");
        error.statusCode = 400;
        throw error;
      }

      const { buffer, originalname, mimetype, size } = req.file;

      // 1. Validate file & extract core metadata using Sharp
      const metadata = await imageService.validateAndExtractMetadata(buffer);

      // 2. Validate visibility if provided
      let visibility = 'public';
      if (req.body.visibility) {
        const lowerVis = String(req.body.visibility).toLowerCase();
        if (!['public', 'private'].includes(lowerVis)) {
          const error = new Error("Visibility must be either 'public' or 'private'");
          error.statusCode = 400;
          throw error;
        }
        visibility = lowerVis;
      }

      // 3. Generate unique asset ID
      const assetId = crypto.randomUUID();
      const parsedPath = path.parse(originalname);
      const cleanBaseName = (parsedPath.name || 'image').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeOriginalName = `${cleanBaseName}${parsedPath.ext || `.${metadata.format}`}`;

      // Keys according to specification:
      // original/${assetId}/${originalName}
      // processed/${assetId}/${baseName}.webp
      // processed/${assetId}/${baseName}.avif
      // thumbnails/${assetId}/${baseName}.webp
      const originalKey = `original/${assetId}/${safeOriginalName}`;
      const webpKey = `processed/${assetId}/${cleanBaseName}.webp`;
      const avifKey = `processed/${assetId}/${cleanBaseName}.avif`;
      const thumbnailKey = `thumbnails/${assetId}/${cleanBaseName}.webp`;

      // 4. Generate processed versions with Sharp
      const variants = await imageService.processVariants(buffer);

      // 5. Upload original and variants to S3
      await Promise.all([
        storageService.upload(originalKey, buffer, mimetype),
        storageService.upload(webpKey, variants.webp.buffer, variants.webp.contentType),
        storageService.upload(avifKey, variants.avif.buffer, variants.avif.contentType),
        storageService.upload(thumbnailKey, variants.thumbnail.buffer, variants.thumbnail.contentType)
      ]);

      // 6. Save metadata in MongoDB
      const tags = parseTags(req.body.tags);
      const folder = req.body.folder ? String(req.body.folder).trim() : null;

      const asset = await Asset.create({
        originalName: originalname,
        mimeType: mimetype,
        size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        originalKey,
        variants: {
          webp: {
            key: webpKey,
            width: variants.webp.width,
            height: variants.webp.height,
            format: variants.webp.format
          },
          avif: {
            key: avifKey,
            width: variants.avif.width,
            height: variants.avif.height,
            format: variants.avif.format
          },
          thumbnail: {
            key: thumbnailKey,
            width: variants.thumbnail.width,
            height: variants.thumbnail.height,
            format: variants.thumbnail.format
          }
        },
        folder,
        tags,
        visibility
      });

      // 7. Format and return response
      const responseData = await formatAssetResponse(asset);
      return res.status(201).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single asset by ID
   * GET /api/assets/:id
   */
  async getAsset(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const asset = await Asset.findById(id);
      if (!asset) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const responseData = await formatAssetResponse(asset);
      return res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dynamic image transformation
   * POST /api/assets/:id/transform
   */
  async transformAsset(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const asset = await Asset.findById(id);
      if (!asset) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      // Fetch original image buffer from S3
      const originalBuffer = await storageService.getObjectBuffer(asset.originalKey);

      // Perform transformation with Sharp
      const transformed = await imageService.transform(originalBuffer, req.body);

      // Generate transformed key
      const timestamp = Date.now();
      const dims = `${transformed.width || 'auto'}x${transformed.height || 'auto'}`;
      const transformedKey = `transformed/${asset._id}/${timestamp}_${dims}.${transformed.format}`;

      // Upload to S3
      await storageService.upload(transformedKey, transformed.buffer, transformed.contentType);

      // Generate appropriate URL
      const url =
        asset.visibility === 'private'
          ? await storageService.generateSignedUrl(transformedKey, 3600)
          : storageService.generateUrl(transformedKey);

      return res.status(200).json({
        success: true,
        data: {
          url,
          key: transformedKey,
          width: transformed.width,
          height: transformed.height,
          format: transformed.format,
          size: transformed.size
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List assets with pagination and filters
   * GET /api/assets
   */
  async listAssets(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = {};

      if (req.query.folder) {
        filter.folder = String(req.query.folder).trim();
      }

      if (req.query.tag) {
        filter.tags = String(req.query.tag).trim();
      }

      if (req.query.visibility) {
        filter.visibility = String(req.query.visibility).toLowerCase();
      }

      const [assets, total] = await Promise.all([
        Asset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Asset.countDocuments(filter)
      ]);

      const data = await Promise.all(assets.map((asset) => formatAssetResponse(asset)));
      const pages = Math.ceil(total / limit) || 1;

      return res.status(200).json({
        success: true,
        data,
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

  /**
   * Delete asset and all associated files from S3
   * DELETE /api/assets/:id
   */
  async deleteAsset(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const asset = await Asset.findById(id);
      if (!asset) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      // Collect all S3 keys to remove
      const s3KeysToDelete = [
        asset.originalKey,
        asset.variants?.webp?.key,
        asset.variants?.avif?.key,
        asset.variants?.thumbnail?.key
      ].filter(Boolean);

      // Delete files from S3
      await storageService.deleteMany(s3KeysToDelete);

      // Delete MongoDB document
      await Asset.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        data: {
          message: 'Asset deleted successfully',
          id: asset._id.toString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate temporary pre-signed URL for an asset
   * GET /api/assets/:id/url
   */
  async getSignedAssetUrl(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const asset = await Asset.findById(id);
      if (!asset) {
        const error = new Error('Asset not found');
        error.statusCode = 404;
        throw error;
      }

      const variant = (req.query.variant || 'original').toLowerCase();
      let key = asset.originalKey;

      if (variant === 'webp') {
        key = asset.variants?.webp?.key;
      } else if (variant === 'avif') {
        key = asset.variants?.avif?.key;
      } else if (variant === 'thumbnail') {
        key = asset.variants?.thumbnail?.key;
      } else if (variant !== 'original') {
        const error = new Error(
          `Invalid variant '${variant}'. Supported variants: original, webp, avif, thumbnail`
        );
        error.statusCode = 400;
        throw error;
      }

      if (!key) {
        const error = new Error(`Variant '${variant}' not found for this asset`);
        error.statusCode = 404;
        throw error;
      }

      const expiresIn = parseInt(req.query.expiresIn, 10) || 3600;
      if (expiresIn <= 0 || expiresIn > 604800) {
        const error = new Error('expiresIn must be between 1 and 604800 seconds');
        error.statusCode = 400;
        throw error;
      }

      const url = await storageService.generateSignedUrl(key, expiresIn);

      return res.status(200).json({
        success: true,
        data: {
          url,
          expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
