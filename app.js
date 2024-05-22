const express = require('express')
const mongoose = require('mongoose')
const app = express()
app.use(express.json())

const employeeRouter = require('./routes/route')

mongoose.connect('mongodb://localhost:27017/employee');
const con = mongoose.connection
con.on('open', function(){
    console.log("DB Connected....");
})

app.get('/',function(req,res,next){
    return res.status(200).send({result:'Success'})
})

app.use('/employee', employeeRouter)


app.listen(9003);



