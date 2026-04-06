const express = require('express');
const router = express.Router();
const {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getResourcesByCategory,
    getAvailableResources,
    getResourceAvailabilityByDate
} = require('../controller/resourceController');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllResources);
router.get('/available', getAvailableResources);
router.get('/category/:category', getResourcesByCategory);
router.get('/:id/availability', getResourceAvailabilityByDate);
router.get('/:id', getResourceById);

// Admin-only routes
router.post('/', auth, isAdmin, createResource);
router.put('/:id', auth, isAdmin, updateResource);
router.delete('/:id', auth, isAdmin, deleteResource);

module.exports = router;
