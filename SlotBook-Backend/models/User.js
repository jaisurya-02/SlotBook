const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['student', 'staff']
    },
    department: {
        type: String,
        required: function() {
            return this.userType === 'student';
        }
    },
    year: {
        type: Number,
        required: function() {
            return this.userType === 'student';
        },
        min: 1,
        max: 4
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
