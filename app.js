const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());
const employeeRouter = require("./routes/route");
const projectRouter = require("./routes/projectroute");
const Employee = require("./models/employeeType");
const redis = require("redis");
const redisClient = redis.createClient();
require("./auth");
const loginRoutes = require("./routes/loginroute");

// mongoose.connect("mongodb://localhost:27017/employee");
// const con = mongoose.connection;
// con.on("open", function () {
//   console.log("DB Connected....");
// });

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});
redisClient.connect().catch(console.error);
const mongoUrl = "mongodb://localhost:27017/employee";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

async function getData(key) {
  const a = new Promise(async (resolve, reject) => {
    // console.log(key)
    let checkData = await redisClient.get(key);
    if (!!!checkData) {
      const mongoData = await Employee.findOne({ id: +key }).exec();
      const currentTime = new Date().getTime();
      const dataToCache = {
        data: mongoData,
        timestamp: currentTime,
        expiryTime: 3600000,
      };
      // Setting the  Redis cache
      redisClient.setEx(key, 3600, JSON.stringify(dataToCache));
      resolve(await redisClient.get(key));
    } else {
      resolve(checkData);
    }
  });
  return a
    .then((d) => {
      console.log(d);
      return d;
    })
    .catch((error) => console.log(error));
}

app.get("/data", async (req, res) => {
  // const email = req.user.email;
  // const employees = await Employee.find({ email: email });
  // res.json(employees);
  const key = req.query.key; 
  if (!key) {
    return res.status(400).send("Key is required");
  }
  try {
    const data = await getData(key);
    res.json(data);
  }catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.use("/employee", employeeRouter);

app.use("/project", projectRouter);

app.use("/", loginRoutes);

app.listen(9004);

module.exports = getData;
