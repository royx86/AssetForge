const express = require('express');
const logController = require('../controllers/log.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', (req, res, next) => logController.getLogs(req, res, next));

module.exports = router;
