const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const storageService = require('./storage.service');
const imageService = require('./image.service');

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
    projectId: asset.projectId ? asset.projectId.toString() : null,
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

class AssetService {
  async uploadAsset({ file, body = {}, projectId = null }) {
    if (!file) {
      const error = new Error("Please provide an image file in the 'file' field");
      error.statusCode = 400;
      throw error;
    }

    const { buffer, originalname, mimetype, size } = file;

    // 1. Validate file & extract core metadata using Sharp
    const metadata = await imageService.validateAndExtractMetadata(buffer);

    // 2. Validate visibility if provided
    let visibility = 'public';
    if (body.visibility) {
      const lowerVis = String(body.visibility).toLowerCase();
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

    const originalKey = `original/${assetId}/${safeOriginalName}`;
    const webpKey = `processed/${assetId}/${cleanBaseName}.webp`;
    const avifKey = `processed/${assetId}/${cleanBaseName}.avif`;
    const thumbnailKey = `thumbnails/${assetId}/${cleanBaseName}.webp`;

    // 4. Generate processed versions with Sharp
    const variants = await imageService.processVariants(buffer);

    // 5. Upload original and variants to S3
    const uploadedKeys = [originalKey, webpKey, avifKey, thumbnailKey];

    try {
      await Promise.all([
        storageService.upload(originalKey, buffer, mimetype),
        storageService.upload(webpKey, variants.webp.buffer, variants.webp.contentType),
        storageService.upload(avifKey, variants.avif.buffer, variants.avif.contentType),
        storageService.upload(thumbnailKey, variants.thumbnail.buffer, variants.thumbnail.contentType)
      ]);

      // 6. Save metadata in MongoDB
      const tags = parseTags(body.tags);
      const folder = body.folder ? String(body.folder).trim() : null;

      const asset = await Asset.create({
        projectId,
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

      return formatAssetResponse(asset);
    } catch (error) {
      await storageService.deleteMany(uploadedKeys).catch((cleanupError) => {
        console.error('[Asset Upload] S3 rollback warning:', cleanupError.message);
      });
      throw error;
    }
  }

  async getAssetById(id, projectId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const query = { _id: id };
    if (projectId) {
      query.projectId = projectId;
    }

    const asset = await Asset.findOne(query);
    if (!asset) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    return formatAssetResponse(asset);
  }

  async listAssets({ projectId = null, page = 1, limit = 20, folder, tag, visibility, search } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (folder) {
      filter.folder = String(folder).trim();
    }
    if (tag) {
      filter.tags = String(tag).trim();
    }
    if (visibility) {
      filter.visibility = String(visibility).toLowerCase();
    }
    if (search && search.trim()) {
      filter.originalName = { $regex: search.trim(), $options: 'i' };
    }

    const [assets, total] = await Promise.all([
      Asset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Asset.countDocuments(filter)
    ]);

    const data = await Promise.all(assets.map((asset) => formatAssetResponse(asset)));
    const pages = Math.ceil(total / limitNum) || 1;

    return {
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    };
  }

  async transformAsset(id, transformOptions, projectId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const query = { _id: id };
    if (projectId) {
      query.projectId = projectId;
    }

    const asset = await Asset.findOne(query);
    if (!asset) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    // Fetch original image buffer from S3
    const originalBuffer = await storageService.getObjectBuffer(asset.originalKey);

    // Perform transformation with Sharp
    const transformed = await imageService.transform(originalBuffer, transformOptions);

    // Generate transformed key
    const timestamp = Date.now();
    const dims = `${transformed.width || 'auto'}x${transformed.height || 'auto'}`;
    const transformedKey = `transformed/${asset._id}/${timestamp}_${dims}.${transformed.format}`;

    // Upload to S3
    await storageService.upload(transformedKey, transformed.buffer, transformed.contentType);

    try {
      await Asset.updateOne(
        { _id: asset._id },
        {
          $push: {
            transformed: {
              key: transformedKey,
              width: transformed.width,
              height: transformed.height,
              format: transformed.format
            }
          }
        }
      );
    } catch (error) {
      await storageService.delete(transformedKey).catch((cleanupError) => {
        console.error('[Asset Transform] S3 rollback warning:', cleanupError.message);
      });
      throw error;
    }

    // Generate appropriate URL
    const url =
      asset.visibility === 'private'
        ? await storageService.generateSignedUrl(transformedKey, 3600)
        : storageService.generateUrl(transformedKey);

    return {
      url,
      key: transformedKey,
      width: transformed.width,
      height: transformed.height,
      format: transformed.format,
      size: transformed.size
    };
  }

  async deleteAsset(id, projectId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const query = { _id: id };
    if (projectId) {
      query.projectId = projectId;
    }

    const asset = await Asset.findOne(query);
    if (!asset) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const s3KeysToDelete = [
      asset.originalKey,
      asset.variants?.webp?.key,
      asset.variants?.avif?.key,
      asset.variants?.thumbnail?.key,
      ...(asset.transformed || []).map((variant) => variant.key)
    ].filter(Boolean);

    await storageService.deleteMany(s3KeysToDelete);
    await Asset.deleteOne({ _id: asset._id });

    return {
      message: 'Asset deleted successfully',
      id: asset._id.toString()
    };
  }

  async getSignedAssetUrl(id, variant = 'original', expiresIn = 3600, projectId = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const query = { _id: id };
    if (projectId) {
      query.projectId = projectId;
    }

    const asset = await Asset.findOne(query);
    if (!asset) {
      const error = new Error('Asset not found');
      error.statusCode = 404;
      throw error;
    }

    const cleanVariant = (variant || 'original').toLowerCase();
    let key = asset.originalKey;

    if (cleanVariant === 'webp') {
      key = asset.variants?.webp?.key;
    } else if (cleanVariant === 'avif') {
      key = asset.variants?.avif?.key;
    } else if (cleanVariant === 'thumbnail') {
      key = asset.variants?.thumbnail?.key;
    } else if (cleanVariant !== 'original') {
      const error = new Error(
        `Invalid variant '${cleanVariant}'. Supported variants: original, webp, avif, thumbnail`
      );
      error.statusCode = 400;
      throw error;
    }

    if (!key) {
      const error = new Error(`Variant '${cleanVariant}' not found for this asset`);
      error.statusCode = 404;
      throw error;
    }

    const parsedExpiresIn = parseInt(expiresIn, 10) || 3600;
    if (parsedExpiresIn <= 0 || parsedExpiresIn > 604800) {
      const error = new Error('expiresIn must be between 1 and 604800 seconds');
      error.statusCode = 400;
      throw error;
    }

    const url = await storageService.generateSignedUrl(key, parsedExpiresIn);

    return {
      url,
      expiresIn: parsedExpiresIn
    };
  }
}

module.exports = new AssetService();
module.exports.formatAssetResponse = formatAssetResponse;
