const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    employeeID: { type: mongoose.Types.ObjectId, ref: "Employee" },
    googleId: { type: mongoose.Types.ObjectId, ref: "User" }  
  },
  { timestamps: true }
);
 
const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
