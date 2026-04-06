const Resource = require('../models/Resource');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Get dashboard statistics for regular users
module.exports.getUserDashboardStats = async (req, res) => {
    try {
        const userId = req.userdata.id;
        
        // Get total resources count
        const totalResources = await Resource.countDocuments();
        
        // Get available resources count
        const availableResources = await Resource.countDocuments({ availability: true });
        
        // Get user's active bookings count
        const myBookings = await Booking.countDocuments({ userId: String(userId), status: { $in: ['pending_staff', 'pending_admin', 'approved'] } });
        
        // Get recent resources (last 5)
        const recentResources = await Resource.find()
            .sort({ createdAt: -1 })
            .limit(5);
        
        const userRole = req.userdata.role || req.userdata.userType;
        let pendingApprovals = 0;
        let recentPendingBookings = [];
        
        if (userRole === 'staff') {
            pendingApprovals = await Booking.countDocuments({ status: 'pending_staff' });
            recentPendingBookings = await Booking.find({ status: 'pending_staff' })
                .populate('resource', 'name')
                .sort({ createdAt: -1 })
                .limit(5);
        }
        
        res.status(200).json({
            stats: {
                totalResources,
                availableResources,
                myBookings,
                ...(userRole === 'staff' && { pendingApprovals })
            },
            recentResources,
            ...(userRole === 'staff' && { recentPendingBookings })
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get dashboard statistics for admin users
module.exports.getAdminDashboardStats = async (req, res) => {
    try {
        // Get total resources count
        const totalResources = await Resource.countDocuments();
        
        // Get available resources count
        const availableResources = await Resource.countDocuments({ availability: true });
        
        // Get total users count
        const totalUsers = await User.countDocuments();
        
        // Get total bookings count
        const totalBookings = await Booking.countDocuments();

        // Get pending approvals count
        const pendingApprovals = await Booking.countDocuments({ status: 'pending_admin' });

        // Get recent resources (last 5)
        const recentResources = await Resource.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Get resources by category
        const resourcesByCategory = await Resource.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent users (last 5)
        const recentUsers = await User.find()
            .select('name email userType department year createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recent pending bookings
        const recentPendingBookings = await Booking.find({ status: 'pending_admin' })
            .populate('resource', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recently booked resources with booking date/time visibility
        const recentBookedResources = await Booking.find({
            status: { $in: ['pending_staff', 'pending_admin', 'approved'] }
        })
            .populate('resource', 'name location')
            .select('resource date startTime endTime status userName userEmail createdAt')
            .sort({ createdAt: -1 })
            .limit(8);

        res.status(200).json({
            stats: {
                totalResources,
                availableResources,
                totalUsers,
                totalBookings,
                pendingApprovals
            },
            recentResources,
            resourcesByCategory,
            recentUsers,
            recentPendingBookings,
            recentBookedResources
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user profile information
module.exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.userdata.id;
        
        // If admin, return admin info
        if (req.userdata.role === 'admin') {
            return res.status(200).json({
                user: {
                    name: 'Admin',
                    email: req.userdata.email,
                    role: 'admin'
                }
            });
        }
        
        // Get user from database
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get quick overview data
module.exports.getQuickOverview = async (req, res) => {
    try {
        const totalResources = await Resource.countDocuments();
        const availableResources = await Resource.countDocuments({ availability: true });
        const totalUsers = await User.countDocuments();
        
        res.status(200).json({
            overview: {
                totalResources,
                availableResources,
                unavailableResources: totalResources - availableResources,
                totalUsers
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
