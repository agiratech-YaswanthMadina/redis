// const mongoose = require('mongoose');

// const employeeSchema = new mongoose.Schema({
//   name: { type: String, required: true, maxlength: 300 },
//   id: { type: Number, required: true, unique: true },
// }, { timestamps: true });

// const Employee = mongoose.model('Employee', employeeSchema);

// module.exports = Employee;


const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  id:{type: Number, required: true, unique: true },
  email: { type: String},
  name: { type: String, required: true },
},{ timestamps: true });

const Employee = mongoose.model('EmployeeModel', employeeSchema);

module.exports = Employee;

