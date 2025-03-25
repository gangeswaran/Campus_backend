const Attendance = require("../model/Attendence");
// const Timetable = require("../model/Timetable");
const Student = require("../model/Student");

exports.Attendance = async (req, res) => {
  try {
    const { latitude, longitude, status, distance } = req.body;
    const { _id, dept, year } = req.student; // Extracted from token

    console.log(_id.toString(), "📌 Marking Attendance");

    // 🛑 Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "❌ Location data is required!" });
    }

    // 🧑‍🎓 Fetch Student Details (Only Needed Fields)
    const student = await Student.findById(_id);
    console.log(student);

    if (!student) {
      return res.status(404).json({ message: "❌ Student not found!" });
    }

    // 🕒 Get Current Time & Day
    const now = new Date();
    const localNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const hours = localNow.getHours(); // Correctly extracts local time
    const dayIndex = now.getDay(); // Now works without error

    // ✅ Check if Attendance is Already Marked
    const alreadyMarked = await Attendance.findOne({
      studentId: _id,
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });

    if (alreadyMarked) {
      console.log(alreadyMarked);

      return res
        .status(200)
        .json({
          message: "⚠️ Attendance already marked for this period!",
          attendance: true,
        });
    }

    // 📝 Save Attendance Record
    const newAttendance = new Attendance({
      studentId: _id,
      studentName: student.name,
      registernum: student.registernum,
      department: dept,
      year,
      status,
      location: { latitude, longitude },
      distance,
      date: now,
    });

    await newAttendance.save();
    return res
      .status(201)
      .json({
        message: "✅ Attendance Marked Successfully!",
        newAttendance,
        success: true,
      });
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    return res
      .status(500)
      .json({ message: "❌ Server Error", error: error.message });
  }
};

const nodemailer = require("nodemailer");
const fs = require("fs");
const cron = require("node-cron");
const ExcelJS = require("exceljs");

const sendAttendanceReport = async () => {
  try {
    // Fetch latest attendance data
    const attendanceData = await Attendance.findOne().sort({ date: -1 });

    if (!attendanceData) {
      console.log("No attendance record found.");
      return;
    }

    // Format the date as DD-MM-YYYY
    const dateObj = new Date(attendanceData.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;

    // Create a new Excel workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Define column headers
    worksheet.columns = [
      { header: "Register Number", key: "registernum", width: 20 },
      { header: "Student Name", key: "studentName", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Distance (m)", key: "distance", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ];

    // Add attendance data
    const row = worksheet.addRow({
      registernum: attendanceData.registernum,
      studentName: attendanceData.studentName,
      status: attendanceData.status,
      distance: attendanceData.distance,
      date: formattedDate,
    });

    // Apply Conditional Formatting (Green for Present, Red for Absent)
    const statusCell = row.getCell(3); // "Status" column is the 3rd column

    if (attendanceData.status === "Present") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "00FF00" }, // Green
      };
    } else {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0000" }, // Red
      };
    }

    // Save file temporarily
    const filePath = "attendance_report.xlsx";
    await workbook.xlsx.writeFile(filePath);

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gcebodi25@gmail.com",
        pass: "bgmh amar uobq aren",
      },
    });

    // Email options
    const mailOptions = {
      from: "gcebodi25@gmail.com",
      to: "gangeswaran375@gmail.com",
      subject: "Attendance Report",
      text: "Please find the attached attendance report.",
      attachments: [{ filename: "attendance_report.xlsx", path: filePath }],
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Attendance report sent successfully!");

    // Delete the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error sending attendance report:", error);
  }
};

// Schedule the function to run at 7:10 PM daily
cron.schedule("22 19 * * *", () => {
  console.log("Running scheduled attendance report at 7:10 PM...");
  sendAttendanceReport();
});

