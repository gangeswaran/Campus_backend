const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");
const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
// const timetableRoutes = require("./routes/timetableRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const Student = require("./model/Student");
const path = require("path");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const { log } = require("console");
require("dotenv").config();
const auth = require("./routes/auth")
connectDB();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Load Face API Models
const MODELS_PATH = path.join(__dirname, "./models");

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
}

loadModels().then(() => console.log("Face API models loaded successfully!"));

// Setup storage for uploaded images
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Face Recognition API
app.post("/recognize", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Image is required" });

    const imagePath = req.file.path;
    const img = await canvas.loadImage(imagePath);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection)
      return res.status(400).json({ error: "No face detected" });

    const users = await Student.find(); // Retrieve all registered users
    let recognizedUser = null;
    let minDistance = 0.6; // Threshold for recognition

    for (const user of users) {
      if (!user.descriptor) continue; // Skip users without face data
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        user.descriptor
      );
      if (distance < minDistance) {
        recognizedUser = user;
        minDistance = distance;
      }
    }

    // Delete uploaded file after processing
    fs.unlinkSync(imagePath);

    if (recognizedUser) {
      console.log(recognizedUser,"wow==");
      
      return res.json({
        message: "Face recognized!",
        user: {
          registernum: recognizedUser.registernum,
          imagePath: recognizedUser.imagePath,
        },
      });
    } else {
      return res.status(400).json({ error: "Face not recognized" });
    }
  } catch (error) {
    console.error("Face Recognition Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);


app.use("/api/auth", auth); 

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
