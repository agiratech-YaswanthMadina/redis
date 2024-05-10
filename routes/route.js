const express = require('express')
const router = express.Router()
const Employee = require('../models/employee')


router.get('/', async(req, res) => {
    try{
        const employees = await Employee.find()
        res.json(employees)

    }catch(err){
        res.send('Error ' + err)
    }
})



router.get('/:id', async(req, res) => {
    try{
        const oneemployee = await Employee.findById(req.params.id)
        res.json(oneemployee)

    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get employee' });
      }
})




router.patch('/:id', async(req, res) => {
    try{
        const oneemployee = await Employee.findById(req.params.id)
        oneemployee.id = req.body.id
        const a1 = await oneemployee.save()
        res.json(a1)

    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update employee' });
      }
})

router.delete('/:id', async(req, res) => {
    try{
        const oneemployee = await Employee.findById(req.params.id)
        oneemployee.id = req.body.id
        const a1 = await oneemployee.deleteOne()
        res.json(a1)

    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete employee' });
      }
})




router.post('/', async(req, res) => {
    try {
        const { name, id } = req.body;
        const employee = new Employee({ name, id });
        await employee.save();
        res.status(201).json({ message: 'Employee created successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create employee' });
      }
})
module.exports = router