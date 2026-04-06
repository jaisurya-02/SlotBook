const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    }
    catch(err){
        console.error("MongoDB connection failed",err);
        process.exit(1);
    }
}

module.exports=connectDB;