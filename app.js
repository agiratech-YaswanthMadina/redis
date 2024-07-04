const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());
const employeeRouter = require("./routes/route");
const projectRouter = require("./routes/projectroute");

require("./auth");

const loginRoutes = require("./routes/loginroute");

mongoose.connect("mongodb://localhost:27017/employee");
const con = mongoose.connection;

con.on("open", function () {
  console.log("DB Connected....");
});

app.use("/employee", employeeRouter);

app.use("/project", projectRouter);

app.use("/", loginRoutes);

app.listen(9004);
