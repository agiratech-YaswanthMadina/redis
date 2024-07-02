const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    googleId: { type: mongoose.Types.ObjectId, ref: "User" }  
  },
  { timestamps: true }
);

const Employee = mongoose.model("EmployeeModel", employeeSchema);

module.exports = Employee;
