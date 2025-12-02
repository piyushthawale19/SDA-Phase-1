import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { initializeSocket, receiveMessage, sendMessage } from "../config/soket";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import { getWebContainer } from "../config/webContainer";
import Navbar from "../components/Navbar"; // adjust path if needed
import "../components/AiTyping.css";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const messageBox = useRef(null); // ✅ useRef for auto-scroll

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);

  const [activeCollaborator, setActiveCollaborator] = useState(null);

  const [popupMessage, setPopupMessage] = useState(null);
  const [popupType, setPopupType] = useState("info"); // info, success, error
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleUserClick = (collaborator) => {
    setActiveCollaborator(collaborator);
  };

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const send = () => {
    if (!message?.trim()) return;

    // Check if this is an AI message
    if (message.toLowerCase().includes("@ai")) {
      setIsAiLoading(true); // Set loading state for AI response
      // Add a temporary loading message from AI
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: user,
          message,
        },
        {
          sender: { _id: "ai", email: "AI" },
          message: JSON.stringify({ text: "Loading..." }),
          isLoading: true,
          tempId: Date.now(), // Add a temporary ID to identify this message later
        },
      ]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: user, message },
      ]);
    }

    // Send message to server
    sendMessage("project-message", {
      message,
      sender: user,
    });

    setMessage("");
  };

  function WriteAiMessage(message, isLoading) {
    let messageObject;

    try {
      messageObject = JSON.parse(message);
    } catch (err) {
      console.error("Error parsing AI message:", err);
      messageObject = { text: "Error parsing message" };
    }

    // If this is a loading message
    if (messageObject.text === "Loading..." || isLoading) {
      return (
        <div className="overflow-auto rounded-sm p-2 bg-slate-900 text-white ai-loading-container">
          <div className="flex items-center space-x-2">
            <div className="ai-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="font-medium ml-2">AI is thinking...</span>
          </div>
        </div>
      );
    }

    // For regular AI messages
    return (
      <div className="overflow-auto rounded-sm p-2 bg-slate-900 text-white">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log("container started");
      });
    }

    receiveMessage("project-message", (data) => {
      if (data.sender._id === "ai") {
        // Turn off AI loading state
        setIsAiLoading(false);

        try {
          const message = JSON.parse(data.message);
          webContainer?.mount(message.fileTree);
          if (message.fileTree) {
            setFileTree(message.fileTree || {});
          }
        } catch (err) {
          console.error("Error parsing AI message:", err);
        }

        // Remove any loading placeholder messages
        setMessages((prevMessages) => {
          // Filter out any AI loading messages
          const filteredMessages = prevMessages.filter(
            (msg) => !(msg.sender._id === "ai" && msg.isLoading)
          );
          // Add the real AI response
          return [...filteredMessages, data];
        });
      } else {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => console.log(res.data))
      .catch((err) => console.log(err));
  }

  const handleRun = async () => {
    if (!webContainer) {
      setPopupMessage("WebContainer not ready!");
      setPopupType("error");
      setTimeout(() => setPopupMessage(null), 3000);
      return;
    }

    try {
      setPopupMessage("Installing dependencies...");
      setPopupType("info");

      await webContainer.mount(fileTree);

      const installProcess = await webContainer.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk);
          },
        })
      );
      await installProcess.exit;

      setPopupMessage("Dependencies installed successfully!");
      setPopupType("success");

      if (runProcess) runProcess.kill();

      const tempRunProcess = await webContainer.spawn("npm", ["start"]);
      tempRunProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk);
          },
        })
      );
      setRunProcess(tempRunProcess);

      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        setPopupMessage("Project is running!");
        setPopupType("success");
        setTimeout(() => setPopupMessage(null), 3000);
      });
    } catch (err) {
      console.error(err);
      setPopupMessage("Error running project!");
      setPopupType("error");
      setTimeout(() => setPopupMessage(null), 3000);
    }
  };

  // ✅ Auto-scroll whenever messages change
  useEffect(() => {
    if (messageBox.current) {
      messageBox.current.scrollTo({
        top: messageBox.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <main className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />

      <div className="flex flex-grow overflow-hidden">
        {/* LEFT SECTION */}
        <section className="left relative flex flex-col min-w-96 bg-slate-300 dark:bg-slate-800 overflow-hidden">
          <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 dark:bg-slate-900 text-gray-900 dark:text-white absolute z-10 top-0">
            <div className="flex items-center gap-3">
              <button
                className="flex gap-2 items-center hover:text-purple-600"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="ri-add-fill mr-1"></i>
                <p>Add collaborator</p>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark((s) => !s)}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-purple-200 dark:hover:bg-purple-700 transition"
                title="Toggle theme"
              >
                {isDark ? (
                  <i className="ri-moon-fill"></i>
                ) : (
                  <i className="ri-sun-line"></i>
                )}
              </button>

              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-purple-300 dark:hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-90 hover:shadow-lg hover:shadow-purple-500/50"
              >
                <i className="ri-group-fill"></i>
              </button>
            </div>
          </header>

          <div className="conversation-area pt-14 flex-grow flex flex-col overflow-hidden">
            <div
              ref={messageBox} // ✅ ref attached
              className="message-box flex-grow flex flex-col gap-1 overflow-auto p-2"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`${
                    msg.sender._id === "ai" ? "max-w-80" : "max-w-52"
                  } ${
                    msg.sender._id === user?._id?.toString() && "ml-auto"
                  } message flex flex-col p-2 bg-slate-50 dark:bg-slate-700  w-fit rounded-md`}
                >
                  <small className="opacity-65 text-xs text-gray-600 dark:text-white">
                    {msg.sender.email}
                  </small>
                  <div className="text-sm">
                    {msg.sender._id === "ai" ? (
                      WriteAiMessage(msg.message, msg.isLoading)
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="inputField w-full flex">
              <input
                type="text"
                placeholder="Enter message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-grow p-2 px-4 border-none outline-none rounded-l-lg bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={send}
                className="px-5 py-2 bg-purple-600 text-white shadow-md hover:bg-purple-700 active:scale-95 transition-all duration-200"
              >
                <i className="ri-send-plane-fill text-lg"></i>
              </button>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div
            className={`sidePanel fixed top-0 left-0 h-full w-96 bg-slate-50 dark:bg-slate-900 shadow-lg flex flex-col transition-transform duration-300 ease-in-out z-40 ${
              isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <header className="flex justify-between items-center px-4 py-3 bg-slate-200 dark:bg-slate-800 border-b">
              <h1 className="font-semibold text-lg">Collaborators</h1>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="p-2 hover:text-red-500 transition"
              >
                <i className="ri-close-fill text-xl"></i>
              </button>
            </header>

            <div className="users flex flex-col gap-2 p-3 overflow-y-auto flex-grow">
              {project?.users?.length ? (
                project.users.map((collaborator) => (
                  <div
                    key={collaborator._id}
                    onClick={() => handleUserClick(collaborator)}
                    className={`flex gap-3 items-center cursor-pointer border p-2 rounded-md hover:bg-purple-200 dark:hover:bg-purple-700 hover:border-purple-500 ${
                      activeCollaborator?._id === collaborator._id
                        ? "bg-slate-200 dark:bg-slate-800 border-purple-500"
                        : "bg-slate-50 dark:bg-slate-900"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 text-white font-bold relative">
                      {collaborator.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {collaborator.email}
                    </h1>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-300 text-sm text-center mt-4">
                  No collaborators yet
                </p>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT SECTION */}
        <section className="right bg-red-50 dark:bg-slate-900 flex-grow flex overflow-hidden">
          <div className="explorer max-w-64 min-w-52 overflow-auto bg-slate-100 dark:bg-slate-600">
            <div className="file-tree w-full">
              {fileTree && typeof fileTree === "object"
                ? Object.keys(fileTree).map((file) => (
                    <button
                      key={file}
                      onClick={() => {
                        setCurrentFile(file);
                        setOpenFiles([...new Set([...openFiles, file])]);
                      }}
                      className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 dark:bg-slate-700 w-full text-gray-900 dark:text-white"
                    >
                      <p className="font-semibold text-lg">{file}</p>
                    </button>
                  ))
                : null}
            </div>
          </div>

          <div className="code-editor flex flex-col flex-grow overflow-hidden">
            <div className="top flex justify-between w-full">
              <div className="files flex">
                {openFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center w-fit gap-2 px-2 py-1 rounded-t-md cursor-pointer ${
                      currentFile === file
                        ? "bg-slate-400 dark:bg-slate-600"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => setCurrentFile(file)}
                      className="font-semibold text-sm text-gray-900 dark:text-white"
                    >
                      {file}
                    </button>
                    <button
                      onClick={() => {
                        const updatedFiles = openFiles.filter(
                          (f) => f !== file
                        );
                        setOpenFiles(updatedFiles);
                        if (currentFile === file) {
                          setCurrentFile(
                            updatedFiles.length ? updatedFiles[0] : null
                          );
                        }
                      }}
                      className="ml-2 text-slate-500 hover:text-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="actions">
                <button
                  onClick={handleRun}
                  className="p-2 px-8 mr-12 bg-white border border-black hover:border-none 
        dark:bg-slate-700 text-gray-900 dark:text-white rounded-md 
        hover:bg-green-500 m-2 transition duration-300 ease-in-out transform 
        hover:scale-90 hover:shadow-lg dark:hover:shadow-slate-100/50 
        hover:shadow-green-500/50"
                >
                  Run
                </button>
              </div>
            </div>

            <div className="bottom flex flex-grow overflow-hidden">
              {fileTree[currentFile] && (
                <div className="code-editor-area flex-grow overflow-auto bg-slate-50 dark:bg-slate-900">
                  <pre className="hljs h-full">
                    <code
                      className="hljs h-full outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedContent = e.target.innerText;
                        const ft = {
                          ...fileTree,
                          [currentFile]: {
                            file: {
                              contents: updatedContent,
                            },
                          },
                        };
                        setFileTree(ft);
                        saveFileTree(ft);
                      }}
                      dangerouslySetInnerHTML={{
                        __html: fileTree[currentFile]?.file?.contents
                          ? hljs.highlight(
                              "javascript",
                              fileTree[currentFile].file.contents
                            ).value
                          : "",
                      }}
                      style={{ whiteSpace: "pre-wrap", paddingBottom: "1rem" }}
                    />
                  </pre>
                </div>
              )}
            </div>
          </div>

          {iframeUrl && webContainer && (
            <div className="flex min-w-96 flex-col h-full bg-slate-100 dark:bg-gray-400  ">
              <div className="address-bar ">
                <input
                  type="text"
                  onChange={(e) => setIframeUrl(e.target.value)}
                  value={iframeUrl}
                  className="w-full p-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <iframe src={iframeUrl} className="w-full h-full"></iframe>
            </div>
          )}
        </section>
      </div>

      {/* ADD COLLABORATORS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md mx-4 p-6 flex flex-col gap-4 relative">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select User
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>

            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() =>
                    setSelectedUserId((prev) => {
                      const updated = new Set(prev);
                      if (updated.has(u._id)) {
                        updated.delete(u._id);
                      } else {
                        updated.add(u._id);
                      }
                      return updated;
                    })
                  }
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer border hover:bg-purple-100 dark:hover:bg-purple-700 transition hover:border-purple-500 ${
                    Array.from(selectedUserId).indexOf(u._id) !== -1
                      ? "bg-slate-200 dark:bg-slate-800 border-purple-500"
                      : "bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold shadow-md">
                    {u.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {u.email}
                  </h1>
                </div>
              ))}
            </div>

            <button
              onClick={addCollaborators}
              className="absolute left-0 bottom-0 w-full bg-gradient-to-r rounded-b-md from-purple-600 to-indigo-600 text-white py-3 hover:from-purple-700 hover:to-indigo-700 shadow-lg transition-all duration-200"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && (
        <div
          className={`fixed top-5 right-5 px-6 py-3 rounded-lg shadow-lg font-semibold transition-all duration-500 ${
            popupType === "info"
              ? "bg-blue-500"
              : popupType === "success"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {popupMessage}
        </div>
      )}
    </main>
  );
};

export default Project;
