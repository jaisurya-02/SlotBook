const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');

const ALLOWED_SLOT_WINDOWS = [
    { startTime: '09:00', endTime: '13:00' }, // FN
    { startTime: '13:00', endTime: '17:00' }, // AN
    { startTime: '17:00', endTime: '21:00' }  // Evening
];

// Create a new booking
module.exports.createBooking = async (req, res) => {
    try {
        const { resourceId, date, startTime, endTime, purpose, staffId } = req.body;
        const { id: userId, email: userEmail, name: userName, role, userType } = req.userdata;

        if (!resourceId || !date || !startTime || !endTime || !purpose) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // For students, staff selection is required so that a specific staff member can approve
        const effectiveRole = role || userType;
        if (effectiveRole === 'student' && !staffId) {
            return res.status(400).json({ error: 'Please select the staff member who should approve this booking.' });
        }

        // Validate time order
        if (startTime >= endTime) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        // Allow only FN / AN / Evening slot windows
        const isAllowedWindow = ALLOWED_SLOT_WINDOWS.some(
            (slot) => slot.startTime === startTime && slot.endTime === endTime
        );
        if (!isAllowedWindow) {
            return res.status(400).json({
                error: 'Invalid time slot. Please choose one of: FN (09:00-13:00), AN (13:00-17:00), Evening (17:00-21:00).'
            });
        }

        // Validate date is not in the past
        const today = new Date().toISOString().split('T')[0];
        if (date < today) {
            return res.status(400).json({ error: 'Booking date cannot be in the past' });
        }

        // Check resource exists and is available
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        if (!resource.availability) {
            return res.status(400).json({ error: 'Resource is currently unavailable' });
        }

        // Prevent double-booking: any overlap on same resource + same date is blocked
        const conflictingBooking = await Booking.findOne({
            resource: resourceId,
            date,
            status: { $in: ['pending_staff', 'pending_admin', 'approved'] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (conflictingBooking) {
            return res.status(409).json({
                error: 'This resource is already booked for the selected date and time. Please choose a different slot.'
            });
        }

        // Determine initial status based on role
        let initialStatus = 'pending_staff';
        if (effectiveRole === 'admin') {
            initialStatus = 'approved';
        } else if (effectiveRole === 'staff') {
            initialStatus = 'pending_admin';
        }

        // Resolve assigned staff details if provided
        let assignedStaffId = '';
        let assignedStaffEmail = '';
        let assignedStaffName = '';

        if (staffId) {
            const staff = await User.findById(staffId);
            if (!staff || staff.userType !== 'staff') {
                return res.status(400).json({ error: 'Selected staff member is invalid.' });
            }
            assignedStaffId = String(staff._id);
            assignedStaffEmail = staff.email;
            assignedStaffName = staff.name;
        }

        const booking = await Booking.create({
            resource: resourceId,
            userId,
            userEmail,
            userName: userName || userEmail,
            date,
            startTime,
            endTime,
            purpose,
            status: initialStatus,
            statusUpdatedById: initialStatus === 'approved' ? String(userId) : '',
            statusUpdatedByEmail: initialStatus === 'approved' ? userEmail : '',
            statusUpdatedByName: initialStatus === 'approved' ? (userName || userEmail) : '',
            statusUpdatedAt: initialStatus === 'approved' ? new Date() : null,
            approvedById: initialStatus === 'approved' ? String(userId) : '',
            approvedByEmail: initialStatus === 'approved' ? userEmail : '',
            approvedByName: initialStatus === 'approved' ? (userName || userEmail) : '',
            approvedAt: initialStatus === 'approved' ? new Date() : null,
            assignedStaffId,
            assignedStaffEmail,
            assignedStaffName
        });

        await booking.populate('resource', 'name category location');

        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get bookings for the currently logged-in user
module.exports.getMyBookings = async (req, res) => {
    try {
        const { id: userId } = req.userdata;
        const bookings = await Booking.find({ userId })
            .populate('resource', 'name category location imageUrl')
            .sort({ date: -1, startTime: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin/Staff: get all bookings
module.exports.getAllBookings = async (req, res) => {
    try {
        const userRole = req.userdata.role || req.userdata.userType;
        const userId = String(req.userdata.id);
        let query = {};
        
        // Only staff and admin can see the approvals list
        if (userRole !== 'staff' && userRole !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to view all bookings' });
        }

        // Staff should only see bookings assigned to them in the approvals context
        if (userRole === 'staff') {
            query.assignedStaffId = userId;
        }

        const bookings = await Booking.find(query)
            .populate('resource', 'name category location')
            .sort({ createdAt: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single booking by id with access control
module.exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.userdata.role || req.userdata.userType;
        const userId = String(req.userdata.id || '');

        const booking = await Booking.findById(id)
            .populate('resource', 'name category location imageUrl')
            .lean();

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const isOwner = String(booking.userId || '') === userId;
        const isAssignedStaff = String(booking.assignedStaffId || '') === userId;

        if (userRole !== 'admin' && !isOwner && !isAssignedStaff) {
            return res.status(403).json({ error: 'Unauthorized to view this booking' });
        }

        res.status(200).json({ booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin/Staff: update booking status (approve / reject)
module.exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userRole = req.userdata.role || req.userdata.userType;
        const actorId = String(req.userdata.id || '');
        const actorEmail = req.userdata.email || '';
        const actorName = req.userdata.name || actorEmail;

        const allowedStatuses = ['pending_admin', 'approved', 'rejected', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const booking = await Booking.findById(id).populate('resource', 'name category location');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Access control: Staff can only act on bookings assigned to them and on 'pending_staff' status
        if (userRole === 'staff') {
            if (booking.assignedStaffId && booking.assignedStaffId !== String(req.userdata.id)) {
                return res.status(403).json({ error: 'You are not assigned to this booking.' });
            }
            if (booking.status !== 'pending_staff') {
                return res.status(403).json({ error: 'Staff can only act on pending_staff bookings' });
            }
            if (status !== 'pending_admin' && status !== 'rejected') {
                return res.status(403).json({ error: 'Staff can only approve (to admin) or reject' });
            }
        } else if (userRole !== 'admin') {
             return res.status(403).json({ error: 'Unauthorized to update booking status' });
        }

        booking.status = status;
        booking.statusUpdatedById = actorId;
        booking.statusUpdatedByEmail = actorEmail;
        booking.statusUpdatedByName = actorName;
        booking.statusUpdatedAt = new Date();

        if (status === 'approved') {
            booking.approvedById = actorId;
            booking.approvedByEmail = actorEmail;
            booking.approvedByName = actorName;
            booking.approvedAt = new Date();
        } else {
            booking.approvedById = '';
            booking.approvedByEmail = '';
            booking.approvedByName = '';
            booking.approvedAt = null;
        }

        await booking.save();

        res.status(200).json({ message: 'Booking status updated', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel own booking
module.exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.userdata;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({ error: 'You can only cancel your own bookings' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
