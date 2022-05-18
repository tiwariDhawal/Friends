const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  expireToken: Date,
  pic: {
    type: String,
    default:
      "https://res.cloudinary.com/dcupoamlr/image/upload/v1644997663/blank-profile-picture-g8b83eda01_1280_hg6ywq.png",
  },
  followers: [{ type: ObjectId, ref: "User" }],
  following: [{ type: ObjectId, ref: "User" }],
});
mongoose.model("User", userSchema);
