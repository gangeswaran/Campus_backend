const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  age: { type: Number, required: true },
  dept: { type: String, required: true },
  year: { type: Number, required: true },
  aadharnumber: { type: String, required: true, unique: true },
  registernum: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true},
  password: { type: String, required: true }, // Store encrypted password
  imagePath: { type: String, required: true },
  descriptor:[Number],

});

// Hash password before saving
StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Student", StudentSchema);
