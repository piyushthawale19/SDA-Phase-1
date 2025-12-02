import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: true,
    trim: true,
    unique: [true, "Project name already exists"],
  },
  description: {
    type: String,
    trim: true,
    default: "", // optional, empty string if not provided
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  fileTree: {
    type: Object,
    default: {},
  },
  imageId: {
    type: String, // optional image for project
    default: null,
  },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
