const express = require("express");
const router = express.Router();
const { Attendance } = require("../controller/attendancecontroller");
const authMiddleware = require("../controller/middelware"); // Fix incorrect path


router.post("/mark-attendance", authMiddleware, Attendance);
module.exports = router;
