import mongoose from "mongoose";
import Project from "../models/project.model.js";

// Create a new project with users array and optional description/image
export const createProject = async ({ name, description = "", users, imageId = null }) => {
  if (!name) throw new Error("Project name is required");
  if (!users || !Array.isArray(users) || users.length === 0)
    throw new Error("Users array is required");

  try {
    const newProject = new Project({
      name,
      description,
      users,
      imageId,
    });

    await newProject.save();

    // Populate users for frontend
    return await Project.findById(newProject._id).populate("users", "name email avatar");
  } catch (error) {
    if (error.code === 11000) throw new Error("Project name already exists");
    throw error;
  }
};

// Get all projects for a specific user
export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) throw new Error("User ID is required");
  return await Project.find({ users: userId })
    .populate("users", "name email avatar")
    .sort({ createdAt: -1 });
};

// Add users to a project (checks duplicates & user belongs to project)
export const addUsersToProject = async ({ projectId, users, userId }) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid project ID");
  if (!users || !Array.isArray(users) || users.some(id => !mongoose.Types.ObjectId.isValid(id)))
    throw new Error("Invalid users array");
  if (!userId) throw new Error("Logged-in user ID is required");
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

  const project = await Project.findOne({ _id: projectId, users: userId });
  if (!project) throw new Error("User does not belong to this project");

  // Add new users without duplicates
  users.forEach(id => {
    if (!project.users.includes(id)) project.users.push(id);
  });

  await project.save();
  return await project.populate("users", "name email avatar");
};

// Get project by ID
export const getProjectById = async ({ projectId }) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid project ID");

  const project = await Project.findById(projectId).populate("users", "name email avatar");
  if (!project) throw new Error("Project not found");
  return project;
};

// Update fileTree
export const updateFileTree = async ({ projectId, fileTree }) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!fileTree || typeof fileTree !== "object") throw new Error("fileTree must be an object");

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  project.fileTree = fileTree;
  await project.save();

  return project;
};
