const express = require("express");
const { registerStudent, loginStudent, getStudentInfo, storeRegisterNumber, getRegisterNumber } = require("../controller/studentcontroller");
const authMiddleware = require("../controller/middelware");

const router = express.Router();


const multer = require("multer");

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure 'uploads/' folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
// Student Registration Route
router.post("/register", upload.single("image"), registerStudent);

// Student Login Route
// router.post("/login", loginStudent);

router.post("/reg", storeRegisterNumber);
router.get("/validate/:num", getRegisterNumber);
// student information r
router.get("/info",authMiddleware, getStudentInfo);

module.exports = router;
