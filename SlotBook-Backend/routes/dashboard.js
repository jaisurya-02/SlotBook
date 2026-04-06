const express = require('express');
const router = express.Router();
const {
    getUserDashboardStats,
    getAdminDashboardStats,
    getUserProfile,
    getQuickOverview
} = require('../controller/dashboardController');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.get('/stats', auth, (req, res) => {
    // Route to appropriate controller based on user role
    if (req.userdata.role === 'admin') {
        return getAdminDashboardStats(req, res);
    } else {
        return getUserDashboardStats(req, res);
    }
});

// Get user profile
router.get('/profile', auth, getUserProfile);

// Admin-only routes
router.get('/admin/stats', auth, isAdmin, getAdminDashboardStats);

// Quick overview (can be public or protected based on requirement)
router.get('/overview', getQuickOverview);

module.exports = router;
