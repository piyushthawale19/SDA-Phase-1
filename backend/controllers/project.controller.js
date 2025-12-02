import projectModel from "../models/project.model.js";
import * as projectService from "../services/project.service.js";
import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";

// Create Project
export const createProject = async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description } = req.body;

    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) return res.status(404).json({ error: "User not found" });

    const users = [loggedInUser._id];
    const imageId = req.file ? req.file.filename : null;

    const newProject = await projectService.createProject({
      name,
      description: description || "",
      users,
      imageId,
    });

    res.status(201).json({ project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// Get all projects for logged-in user
export const getAllProjects = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) return res.status(404).json({ error: "User not found" });

    const allUserProjects = await projectService.getAllProjectByUserId({
      userId: loggedInUser._id,
    });

    res.status(200).json({ projects: allUserProjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// Add users to project
export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { projectId, users } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const project = await projectService.addUsersToProject({
      projectId,
      users,
      userId: loggedInUser._id,
    });

    return res.status(200).json({ project });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await projectService.getProjectById({ projectId });
    if (!project) return res.status(404).json({ error: "Project not found" });

    await project.populate("users", "name email avatar"); // populate users
    return res.status(200).json({ project });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

// Update fileTree
export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { projectId, fileTree } = req.body;
    const project = await projectService.updateFileTree({ projectId, fileTree });
    return res.status(200).json({ project });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};
