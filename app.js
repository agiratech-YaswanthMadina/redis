const express = require('express')
const mongoose = require('mongoose')
const app = express()
const url = 'mon'
app.use(express.json())

const employeeRouter = require('./routes/route')
app.use('/employee', employeeRouter)
mongoose.connect('mongodb://localhost:27017/employee', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const con = mongoose.connection
con.on('open', function(){
    console.log("DB Connected....");
})

app.listen(9000);