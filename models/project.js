const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    id: { type: Number, required: true },
  name: { type: String, required: true }
  // Add other fields as necessary
}, { timestamps: true });

// module.exports = mongoose.model('Project', projectSchema);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;