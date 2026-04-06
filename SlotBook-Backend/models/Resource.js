const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Classroom', 'Lab', 'Hall', 'Sports Facility', 'Equipment','Open Ground','Other']
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    availability: {
        type: Boolean,
        default: true
    },
    features: {
        type: [String],
        default: []
    },
    imageUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'resource'
});

module.exports = mongoose.model('Resource', resourceSchema);
