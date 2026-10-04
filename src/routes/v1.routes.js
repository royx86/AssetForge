const express = require('express');
const assetController = require('../controllers/asset.controller');
const apiKeyMiddleware = require('../middleware/apiKey.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Require API Key authentication for all v1 external routes
router.use(apiKeyMiddleware);

// Upload asset using API key (automatically associated with req.project)
router.post('/assets', upload.single('file'), (req, res, next) =>
  assetController.uploadAsset(req, res, next)
);

// List assets for project identified by API key
router.get('/assets', (req, res, next) =>
  assetController.listAssets(req, res, next)
);

// Get single asset by ID
router.get('/assets/:id', (req, res, next) =>
  assetController.getAsset(req, res, next)
);

// Transform image
router.post('/assets/:id/transform', (req, res, next) =>
  assetController.transformAsset(req, res, next)
);

// Delete asset
router.delete('/assets/:id', (req, res, next) =>
  assetController.deleteAsset(req, res, next)
);

// Get signed URL
router.get('/assets/:id/url', (req, res, next) =>
  assetController.getSignedAssetUrl(req, res, next)
);

module.exports = router;
