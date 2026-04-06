const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

// Get all resources
module.exports.getAllResources = async (req, res) => {
    try {
        const resources = await Resource.find();
        res.status(200).json({ resources });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single resource by ID
module.exports.getResourceById = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resource.findById(id);
        
        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        
        res.status(200).json({ resource });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new resource
module.exports.createResource = async (req, res) => {
    try {
        const { name, description, category, location, capacity, features, imageUrl } = req.body;
        
        const resource = await Resource.create({
            name,
            description,
            category,
            location,
            capacity,
            features,
            imageUrl
        });
        
        res.status(201).json({ message: "Resource created successfully", resource });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a resource
module.exports.updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const resource = await Resource.findByIdAndUpdate(id, updates, { 
            new: true, 
            runValidators: true 
        });
        
        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        
        res.status(200).json({ message: "Resource updated successfully", resource });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a resource
module.exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        
        const resource = await Resource.findByIdAndDelete(id);
        
        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        
        res.status(200).json({ message: "Resource deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get resources by category
module.exports.getResourcesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const resources = await Resource.find({ category });
        
        res.status(200).json({ resources });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get available resources
module.exports.getAvailableResources = async (req, res) => {
    try {
        const resources = await Resource.find({ availability: true });
        res.status(200).json({ resources });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get resource availability for a specific date
module.exports.getResourceAvailabilityByDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startDate, endDate } = req.query;

        const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

        if (!date && !(startDate && endDate)) {
            return res.status(400).json({
                error: 'Provide either date=YYYY-MM-DD or startDate=YYYY-MM-DD&endDate=YYYY-MM-DD'
            });
        }

        if (date && !isValidDateString(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        if ((startDate && !endDate) || (!startDate && endDate)) {
            return res.status(400).json({
                error: 'Both startDate and endDate are required for range availability'
            });
        }

        if (startDate && endDate && (!isValidDateString(startDate) || !isValidDateString(endDate))) {
            return res.status(400).json({ error: 'Invalid date range format. Use YYYY-MM-DD' });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({ error: 'startDate cannot be later than endDate' });
        }

        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        const activeStatuses = ['pending_staff', 'pending_admin', 'approved'];

        if (date) {
            const bookings = await Booking.find({
                resource: id,
                date,
                status: { $in: activeStatuses }
            })
                .select('date startTime endTime status userName userEmail purpose')
                .sort({ startTime: 1 });

            return res.status(200).json({
                resource: {
                    _id: resource._id,
                    name: resource.name,
                    category: resource.category,
                    location: resource.location,
                    availability: resource.availability
                },
                date,
                bookedDurations: bookings
            });
        }

        const bookings = await Booking.find({
            resource: id,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: activeStatuses }
        })
            .select('date startTime endTime status userName userEmail purpose')
            .sort({ date: 1, startTime: 1 });

        const bookedDurationsByDate = bookings.reduce((acc, booking) => {
            if (!acc[booking.date]) {
                acc[booking.date] = [];
            }
            acc[booking.date].push(booking);
            return acc;
        }, {});

        res.status(200).json({
            resource: {
                _id: resource._id,
                name: resource.name,
                category: resource.category,
                location: resource.location,
                availability: resource.availability
            },
            startDate,
            endDate,
            bookedDurationsByDate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
