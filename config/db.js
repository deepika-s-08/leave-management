
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb://127.0.0.1:27017/leave-management"
        );

        console.log("MongoDB connected successfully");
    } catch (error) {
        throw error;
    }
};

module.exports = connectDB;
