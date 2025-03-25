const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const path = require("path");

const Student = require("../model/Student");
const { Canvas, Image, ImageData } = canvas;

// ✅ Monkey-patch for face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Ensure models are loaded
async function loadModels() {
  const modelPath = path.join(__dirname, "../models");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  console.log("✅ Face detection models loaded.");
}

// ✅ Setup Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Register Student Route
exports.registerStudent = async (req, res) => {
  const { name, dob, address, age, dept, year, aadharnumber, registernum, email, password } = req.body;

  // ❌ Missing Fields
  if (!req.file || !name || !dob || !address || !age || !dept || !year || !aadharnumber || !registernum || !email || !password) {
    return res.status(400).json({ success: false, message: "❌ Missing required fields!" });
  }

  try {
    // ✅ Check if student is already registered
    const existingStudent = await Student.findOne({ registernum });
    if (existingStudent) {
      return res.status(409).json({ success: false, message: "❌ Student already registered!" });
    }

    // ✅ Load Face Detection Models
    await loadModels();

    const imagePath = req.file.path;
    console.log("🖼️ Image Path:", imagePath);

    // ✅ Load Image
    const img = await canvas.loadImage(imagePath);
    const input = faceapi.createCanvasFromMedia(img);

    // ✅ Face Detection
    const detection = await faceapi.detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.error("❌ No face detected in image:", imagePath);
      return res.status(400).json({ success: false, message: "❌ No face detected!" });
    }

    console.log("😀 Face detected with descriptor length:", detection.descriptor.length);

    // ✅ Save Student Data
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({
      name,
      dob,
      address,
      age,
      dept,
      year,
      aadharnumber,
      registernum,
      email,
      password,
      imagePath,
      descriptor: Array.from(detection.descriptor),
    });

    await newStudent.save();
    res.status(201).json({ success: true, message: "✅ Student Registered Successfully!" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: "❌ Server Error", error: error.message });
  }
};

// ✅ Calculate Distance Between Two Face Descriptors
exports.calculateDistance = (descriptor1, descriptor2) => {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};







// KDSTQ942KM5M2U63PA4PCNPT
// ✅ Login Student (Now Works with Hashed Password)
// const otpStore = new Map(); 
// exports.loginStudent = async (req, res) => {
//   const { registernum, otp } = req.body;

//   try {
//     const storedOtp = otpStore.get(registernum);
//     console.log(`Stored OTP for ${registernum}:`, storedOtp); // Debugging

//     if (!storedOtp || storedOtp !== otp.toString()) {
//       return res.status(401).json({ success: false, message: "❌ Invalid or expired OTP!" });
//     }

//     const student = await Student.findOne({ registernum });
//     if (!student) {
//       return res.status(404).json({ success: false, message: "❌ Student not found!" });
//     }

//     // ✅ Generate JWT Token
//     const token = jwt.sign(
//       { id: student._id, registernum: student.registernum, role: student.role },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // ✅ Clear OTP after verification
//     otpStore.delete(registernum);

//     res.json({
//       success: true,
//       message: "✅ Login successful!",
//       token,
//       user: {
//         name: student.name,
//         email: student.email,
//         registernum: student.registernum,
//       },
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ success: false, message: "❌ Server Error" });
//   }
// };


// get student information
exports.getStudentInfo = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: "�� Student not found!" });
    res.json({ success: true, message: "✅ Student Information Retrieved!", student });
    } catch (error) {
    console.error("Get Student Info Error:", error);
    res.status(500).json({ success: false, message: "�� Server Error", error: error.message });
  }
  };





// Controller to get timetable for a student
exports.getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming user is authenticated and ID is available from JWT

    // Find student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch timetable based on student's department and year
    const timetable = await Timetable.findOne({ dept: student.dept, year: student.year });
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.status(200).json({ timetable });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const RegisterNumber =require("../model/RegisterNumber")
exports.storeRegisterNumber = async (req, res) => {
  try {
    const { registerNumbers } = req.body;

    if (!Array.isArray(registerNumbers)) {
        return res.status(400).json({ message: "registerNumbers must be an array" });
    }

    // Check if a document already exists; if yes, update it
    let existingData = await RegisterNumber.findOne();
    if (existingData) {
        existingData.registerNumbers = registerNumbers;
        await existingData.save();
    } else {
        await RegisterNumber.create({ registerNumbers });
    }

    res.status(201).json({ message: "Register numbers saved successfully" });
} catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
}
};

exports.getRegisterNumber = async (req, res) => {
  try {
      const { num } = req.params; // Get register number from request params

      const data = await RegisterNumber.findOne();
      if (!data || !data.registerNumbers.includes(Number(num))) {
          return res.status(404).json({ message: "Register number not found" });
      }

      res.status(200).json({ message: "Register number exists", num ,valid: true });
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
