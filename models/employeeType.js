const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 300 },
  id: { type: Number, required: true, unique: true },
 
}, { timestamps: true });

// employeeSchema.index({ name: 'text', email: 'text', position: 'text' });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;



