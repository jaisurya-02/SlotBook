const jwt=require('jsonwebtoken');

const auth=(req,res,next)=>{
    console.log("Auth Middleware Invoked", req.headers);
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({error:"Unauthorized"});
    }
    
    // Extract token from "Bearer <token>" or use directly if no Bearer prefix
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
    
    try{
    const decoded=jwt.verify(token,process.env.SECRET_KEY);
    console.log(decoded);
    req.userdata = {
        ...decoded,
        id: decoded.userId, 
        email: decoded.email, 
        role: decoded.role || decoded.userType // fallback
    };
    next();
    }
    catch(error){
        return res.status(401).json({error:"Unauthorized",message: error.message});
}
}

// Admin-only middleware
const isAdmin = (req, res, next) => {
    if (req.userdata && req.userdata.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    }
};

module.exports = { auth, isAdmin };