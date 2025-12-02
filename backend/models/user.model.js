import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: [6, "Email must be at least 6 characters long"],
    maxLength: [50, "Email must not be longer than 50 characters"],
  },
  password: {
    type: String,
    select: false,
  },
  // 🆕 Avatar (default image or custom URL)
  avatar: {
    type: String,
    default: "/avatars/default1.png", // points to your frontend public assets
  },

  // 🆕 Theme (light/dark)
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
});

// Static method
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

// Instance method
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method
userSchema.methods.generateJWT = function () {
  return jwt.sign({  _id: this._id,email: this.email }, process.env.JWT_SECRET);
};

const User = mongoose.model("User", userSchema);

export default User;
