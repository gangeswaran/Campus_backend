const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true }, // Reference to Student model
  studentName: { type: String, required: true },
  registernum: { type: Number, required: true, unique: true },
  department: { type: String, required: true }, // To match with timetable
  year: { type: Number, required: true }, // To match with timetable
  status: { type: String, enum: ["Present", "Absent"], required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  distance: { type: Number, required: true},
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
