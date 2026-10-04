const express = require('express');
const projectController = require('../controllers/project.controller');
const assetController = require('../controllers/asset.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const apiKeyRoutes = require('./apiKey.routes');
const usageRoutes = require('./usage.routes');
const logRoutes = require('./log.routes');

const router = express.Router();

// Require authentication for all project routes
router.use(authMiddleware);

// Project CRUD
router.post('/', (req, res, next) => projectController.createProject(req, res, next));
router.get('/', (req, res, next) => projectController.getProjects(req, res, next));
router.get('/:id', (req, res, next) => projectController.getProject(req, res, next));
router.put('/:id', (req, res, next) => projectController.updateProject(req, res, next));
router.delete('/:id', (req, res, next) => projectController.deleteProject(req, res, next));

// Sub-resources
router.use('/:projectId/api-keys', apiKeyRoutes);
router.use('/:projectId/usage', usageRoutes);
router.use('/:projectId/logs', logRoutes);

// Project Assets
router.post('/:projectId/assets', upload.single('file'), (req, res, next) =>
  assetController.uploadAsset(req, res, next)
);
router.get('/:projectId/assets', (req, res, next) =>
  assetController.listAssets(req, res, next)
);
router.get('/:projectId/assets/:id', (req, res, next) =>
  assetController.getAsset(req, res, next)
);
router.post('/:projectId/assets/:id/transform', (req, res, next) =>
  assetController.transformAsset(req, res, next)
);
router.delete('/:projectId/assets/:id', (req, res, next) =>
  assetController.deleteAsset(req, res, next)
);
router.get('/:projectId/assets/:id/url', (req, res, next) =>
  assetController.getSignedAssetUrl(req, res, next)
);

module.exports = router;
