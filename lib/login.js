const jwt = require("jsonwebtoken")
const generateToken = require('../utils/jwt')


try {
    const { id, name, employeeID } = req.body;
    // Find the employee by ID
    const employee = await Employee.findById(employeeID);
    if (!employee) {
      return res.status(404).send({ error: 'Employee not found' });
    }

    // Create the project and associate it with the employee
    // const project = new Project({ id, name, employee: employee._id });
    // // console.log(employee);
    // await project.save();
    generateToken(employee)
    // res.status(201).send(project);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }


