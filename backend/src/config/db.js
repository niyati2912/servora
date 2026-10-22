const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected",mongoose.connection.name);
    }
    catch(error){
        console.error("mongoDb connection errors failed", error.message);
    }
};

module.exports = connectDB;


