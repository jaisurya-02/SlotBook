const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        default: ''
    },
    assignedStaffId: {
        type: String,
        default: ''
    },
    assignedStaffEmail: {
        type: String,
        default: ''
    },
    assignedStaffName: {
        type: String,
        default: ''
    },
    date: {
        type: String,   // stored as "YYYY-MM-DD"
        required: true
    },
    startTime: {
        type: String,   // stored as "HH:MM"
        required: true
    },
    endTime: {
        type: String,   // stored as "HH:MM"
        required: true
    },
    purpose: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending_staff', 'pending_admin', 'approved', 'rejected', 'cancelled'],
        default: 'pending_staff'
    },
    statusUpdatedById: {
        type: String,
        default: ''
    },
    statusUpdatedByEmail: {
        type: String,
        default: ''
    },
    statusUpdatedByName: {
        type: String,
        default: ''
    },
    statusUpdatedAt: {
        type: Date,
        default: null
    },
    approvedById: {
        type: String,
        default: ''
    },
    approvedByEmail: {
        type: String,
        default: ''
    },
    approvedByName: {
        type: String,
        default: ''
    },
    approvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
