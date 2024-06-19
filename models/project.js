const mongoose = require('mongoose');
// const Employee = require('./employeeType')


const projectSchema = new mongoose.Schema({
    id: { type: Number, required: true },
  name: { type: String, required: true },
  employeeID: {type: mongoose.Types.ObjectId, ref:"Employee"}
  // Add other fields as necessary
}, { timestamps: true });
// module.exports = mongoose.model('Project', projectSchema);

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;

