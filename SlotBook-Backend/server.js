require('dotenv').config();
const express=require('express');
const app=express();
app.use(express.json());
const authRouter=require('./routes/auth');
const resourceRouter=require('./routes/resource');
const dashboardRouter=require('./routes/dashboard');
const bookingRouter=require('./routes/booking');
const mongoose=require('mongoose');
const User=require('./models/User');
const cors = require('cors');
const connectDB=require('./config/db');
connectDB();
app.use(cors());
// Middleware

app.use((req,res,next)=>{
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/auth',authRouter);
app.use('/resources',resourceRouter);
app.use('/dashboard',dashboardRouter);
app.use('/bookings',bookingRouter);

app.listen(process.env.PORT,()=>{
    console.log(`Server is running http://localhost:${process.env.PORT}`);
})   