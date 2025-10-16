const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getReports, getMetrics } = require('../controllers/analyticsController');

// Analytics routes
router.get('/dashboard', getDashboardMetrics);
router.get('/reports', getReports);
router.get('/metrics', getMetrics);

module.exports = router;
