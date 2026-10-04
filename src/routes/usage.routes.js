const express = require('express');
const usageController = require('../controllers/usage.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', (req, res, next) => usageController.getUsage(req, res, next));

module.exports = router;
