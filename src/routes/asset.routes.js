const express = require('express');
const multer = require('multer');
const assetController = require('../controllers/asset.controller');

const router = express.Router();

// Allowed MIME types according to specification
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 25 * 1024 * 1024 // default 25MB
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      const error = new Error(
        `Unsupported image format: ${file.mimetype}. Allowed formats: JPEG, PNG, WebP, AVIF`
      );
      error.statusCode = 400;
      return cb(error, false);
    }
    cb(null, true);
  }
});

// 1. Upload Image (POST /api/assets)
router.post('/', upload.single('file'), (req, res, next) => {
  assetController.uploadAsset(req, res, next);
});

// 2. List Assets (GET /api/assets)
router.get('/', (req, res, next) => {
  assetController.listAssets(req, res, next);
});

// 3. Get Asset (GET /api/assets/:id)
router.get('/:id', (req, res, next) => {
  assetController.getAsset(req, res, next);
});

// 4. Generate Pre-signed URL (GET /api/assets/:id/url)
router.get('/:id/url', (req, res, next) => {
  assetController.getSignedAssetUrl(req, res, next);
});

// 5. Dynamic Transformation (POST /api/assets/:id/transform)
router.post('/:id/transform', (req, res, next) => {
  assetController.transformAsset(req, res, next);
});

// 6. Delete Asset (DELETE /api/assets/:id)
router.delete('/:id', (req, res, next) => {
  assetController.deleteAsset(req, res, next);
});

module.exports = router;
