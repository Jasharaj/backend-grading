import jwt from "jsonwebtoken";
import Faculty from "../models/FacultySchema.js";
import TA from "../models/TASchema.js";
import Student from "../models/StudentSchema.js";

export const authenticate = async (req, res, next) => {
  //get token from headers
  const authToken = req.headers.authorization;

  //check token if exists or not
  if (!authToken || !authToken.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const token = authToken.split(" ")[1];

    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.userId = decoded.id;
    req.role = decoded.role;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token is expired" });
    }

    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export const restrict = (roles) => async (req, res, next) => {
  const userRole = req.role; // Get role from JWT token set by authenticate middleware
  const userId = req.userId;
  
  // Debug logging
  console.log('Restriction check:', {
    userRole,
    userId,
    requiredRoles: roles,
    hasRole: roles.includes(userRole)
  });

  // Verify user exists in database
  let user;
  if (userRole === 'Faculty') {
    user = await Faculty.findById(userId);
  } else if (userRole === 'TA') {
    user = await TA.findById(userId);
  } else if (userRole === 'Student') {
    user = await Student.findById(userId);
  }

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "User not found" });
  }

  if (!roles.includes(userRole)) {
    return res
      .status(403)
      .json({ success: false, message: "You're not authorized to access this resource" });
  }

  next();
};
