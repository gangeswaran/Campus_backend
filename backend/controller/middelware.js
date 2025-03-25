const jwt = require("jsonwebtoken");
const Student = require("../model/Student");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from Authorization header
  console.log("---Token:", token);

  if (!token) {
    console.log("---Invalid token");
    return res.status(401).json({ success: false, message: "Access Denied! No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.student = await Student.findById(decoded.id).select("-password"); // Attach student to request
    // console.log("---Student:", req.student);
    if (!req.student) {
      console.log("Invalid token");
      return res.status(404).json({ success: false, message: "Student not found!" });
    }
    next();
  } catch (err) {
    console.log("--Invalid token");
    res.status(401).json({ success: false, message: "Invalid Token!" });
  }
};

const faceapi = require("face-api.js");
const canvas = require("canvas");
const { loadImage } = require("canvas");

// Load face-api models
const loadFaceAPIModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
};

// Function to compare face
const compareFaces = async (capturedImage, storedImage) => {
  try {
    const capturedImg = await loadImage(capturedImage);
    const storedImg = await loadImage(storedImage);

    const capturedDesc = await faceapi.detectSingleFace(capturedImg).withFaceLandmarks().withFaceDescriptor();
    const storedDesc = await faceapi.detectSingleFace(storedImg).withFaceLandmarks().withFaceDescriptor();

    if (!capturedDesc || !storedDesc) return false;

    const distance = faceapi.euclideanDistance(capturedDesc.descriptor, storedDesc.descriptor);
    return distance < 0.6; // Lower distance = higher similarity
  } catch (error) {
    console.error("Face comparison error:", error);
    return false;
  }
};




module.exports = { loadFaceAPIModels, compareFaces };
module.exports =authMiddleware;

