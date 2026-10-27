const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
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

    rollNumber: {
        type: String,
        required: true
    },

    casualLeave: {
        type: Number,
        default: 10
    },

    medicalLeave: {
        type: Number,
        default: 10
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;