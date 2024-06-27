const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  id: {
    type: Number,
    required: true,
  },
  // Add other fields as needed
});


const User = mongoose.model("User", userSchema);
module.exports = User;

