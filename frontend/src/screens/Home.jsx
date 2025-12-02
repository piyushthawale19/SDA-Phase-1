import React, { useState, useEffect, useContext } from "react";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { UserContext } from "../context/user.context";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectImage, setProjectImage] = useState(null);
  const [projects, setProjects] = useState([]);

  const defaultImages = [
    "/Project/default1.jpg",
    "/Project/default2.jpg",
    "/Project/default3.jpg",
    "/Project/default4.jpg",
    "/Project/default5.jpg",
    "/Project/default6.jpg",
    "/Project/default7.jpg",
    "/Project/default8.jpg",
    "/Project/default9.jpg",
  ];

  const navigate = useNavigate();
  const { user } = useContext(UserContext);

 useEffect(() => {
  axios
    .get("/projects/all")
    .then((res) => {
      // Sort if backend not sorted by date
      const sortedProjects = res.data.projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProjects(sortedProjects);
    })
    .catch((err) => console.error(err));
}, []);

// Create Project
const createProject = async (e) => {
  e.preventDefault();
  if (!projectName) return alert("Project name is required");

  const formData = new FormData();
  formData.append("name", projectName);
  formData.append("description", projectDesc);
  if (projectImage) formData.append("image", projectImage);

  try {
    const res = await axios.post("/projects/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.project) {
      // Prepend new project
      setProjects((prev) => [res.data.project, ...prev]);
    }

    setIsModalOpen(false);
    setProjectName("");
    setProjectDesc("");
    setProjectImage(null);
  } catch (err) {
    console.error(err.response?.data || err);
  }
};


  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="p-4 flex flex-col items-center gap-6 w-full">
        {/* New Project Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="border border-slate-300 rounded-md 
            bg-white text-gray-900  
            dark:bg-purple-500 dark:text-white 
            hover:bg-purple-800 hover:text-white 
            px-32 py-3 mt-10 mb-6
            transition duration-300 ease-in-out 
            transform hover:scale-105 hover:shadow-lg hover:shadow-purple-400/50"
        >
          New Project <i className="ri-link ml-2"></i>
        </button>

        {/* Projects List */}
        <div className="flex flex-wrap justify-center gap-4">
          {projects?.map((project) =>
            project ? (
              <div
                key={project._id}
                onClick={() => navigate(`/project`, { state: { project } })}
                className="project p-4 flex flex-col gap-2 cursor-pointer 
                  border border-slate-300 rounded-md w-60 
                  bg-white text-gray-900 
                  dark:bg-purple-500 dark:text-white 
                  hover:bg-purple-800 hover:text-white 
                  transition duration-300 ease-in-out 
                  transform hover:scale-105 hover:shadow-lg hover:shadow-purple-400/50"
              >
                {/* Project Image */}
                <div className="w-full h-28 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                  <img
                    src={
                      project.imageId
                        ? `http://localhost:8080/uploads/${project.imageId}`
                        : defaultImages[
                            Math.floor(Math.random() * defaultImages.length)
                          ]
                    }
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/Project/default1.jpg")}
                  />
                </div>

                <h2 className="font-semibold">
                  {project?.name || "Untitled Project"}
                </h2>
                <p className="text-sm text-black dark:text-gray-200 line-clamp-2">
                  {project?.description || "No description provided."}
                </p>

                {/* Collaborators */}
                <div className="flex items-center gap-2 mt-2">
                  <AvatarGroup max={3}>
                    {project?.users?.map((u) => {
                      const isDefaultAvatar =
                        !u.avatar || u.avatar === "/avatars/default1.png";
                      return (
                        <Avatar
                          key={u._id}
                          alt={u.name || u.email}
                          src={isDefaultAvatar ? undefined : u.avatar}
                          sx={{
                            bgcolor: isDefaultAvatar ? "#553c9a" : undefined,
                            color: "#fff",
                          }}
                        >
                          {isDefaultAvatar
                            ? u.email?.charAt(0).toUpperCase() || "?"
                            : null}
                        </Avatar>
                      );
                    })}
                  </AvatarGroup>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Create Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Project</h2>
              <form onSubmit={createProject} className="flex flex-col gap-4">
                <label className="block">
                  <span className="text-lg font-medium text-gray-700">
                    Project Name
                  </span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-lg font-medium text-gray-700">
                    Project Description
                  </span>
                  <textarea
                    rows="3"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none"
                  />
                </label>

                {/* <label className="block">
                  <span className="text-lg font-medium text-gray-700">Project Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProjectImage(e.target.files[0])}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </label> */}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-slate-950"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
