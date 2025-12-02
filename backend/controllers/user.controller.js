import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await userService.createUser(req.body);
    const token = await user.generateJWT();

    delete user._doc.password;

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const loginController = async (req, res) => {
  // Check validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ errors: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ errors: "Invalid email or password" });
    }

    // Generate JWT token
    const token = user.generateJWT();

    // Remove password before sending response
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ user: userData, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ errors: "Something went wrong, please try again." });
  }
};


export const profileController = async (req, res) => {
  console.log(req.user);

  res.status(200).json({ user: req.user });
};

export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];

    redisClient.set(token, "logout", "EX", 60 * 60 * 24);

    res.status(200).json({ message: "Logout successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};


export const getAllUsersController =async(req,res) =>{
  try {
    const loggedInUser =await userModel.findOne({
    email:req.user.email
    })

    const allUsers = await userService.getAllUsers({userId: loggedInUser._id})

    return res.status(200).json({
      users : allUsers
    })

  } catch (err) {
    console.log(err)
    res.status(400).send(err.message);
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from authUser middleware
    const { avatar, theme } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (avatar) user.avatar = avatar;
    if (theme) user.theme = theme;

    await user.save();

    // Return only needed fields
    const { password, ...userData } = user.toObject();
    res.json({ user: userData });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};