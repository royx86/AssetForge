const express = require('express');
const apiKeyController = require('../controllers/apiKey.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', (req, res, next) => apiKeyController.createApiKey(req, res, next));
router.get('/', (req, res, next) => apiKeyController.getApiKeys(req, res, next));
router.delete('/:id', (req, res, next) => apiKeyController.deleteApiKey(req, res, next));

module.exports = router;
