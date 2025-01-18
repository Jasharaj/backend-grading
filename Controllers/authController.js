import Student from "../models/StudentSchema.js";
import Faculty from "../models/FacultySchema.js";
import TA from "../models/TASchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "15d" }
  );
};

export const register = async (req, res) => {
  const { id, name, email, password, role } = req.body;

  try {
    let user = null;
    
    // Check if user exists with the email
    const existingStudent = await Student.findOne({ email });
    const existingFaculty = await Faculty.findOne({ email });
    const existingTA = await TA.findOne({ email });

    if (existingStudent || existingFaculty || existingTA) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Check if ID is already used
    const existingStudentId = await Student.findOne({ id });
    const existingFacultyId = await Faculty.findOne({ id });
    const existingTAId = await TA.findOne({ id });

    if (existingStudentId || existingFacultyId || existingTAId) {
      return res.status(400).json({ message: "ID already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create user based on role
    switch (role) {
      case "Student":
        user = new Student({
          id,
          name,
          email,
          password: hashPassword
        });
        break;
      case "Faculty":
        user = new Faculty({
          id,
          name,
          email,
          password: hashPassword
        });
        break;
      case "TA":
        user = new TA({
          id,
          name,
          email,
          password: hashPassword
        });
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    await user.save();
    res.status(201).json({ success: true, message: "User successfully registered" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error, try again" });
  }
};

export const login = async (req, res) => {
  const { id, password } = req.body;

  try {
    let user = null;

    // Check in all collections using ID
    const student = await Student.findOne({ id });
    const faculty = await Faculty.findOne({ id });
    const ta = await TA.findOne({ id });

    if (student) {
      user = student;
      user.role = "Student";
    } else if (faculty) {
      user = faculty;
      user.role = "Faculty";
    } else if (ta) {
      user = ta;
      user.role = "TA";
    }

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Successfully logged in",
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error, try again" });
  }
};