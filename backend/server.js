import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";

import app from "./app.js";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";
import Logger from "./services/logger.service.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
  // Optimized timeouts for fast AI responses (under 1 minute)
  connectTimeout: 70000, // 70 seconds
  pingTimeout: 40000, // 40 seconds
  pingInterval: 20000, // 20 seconds between pings
  // Allow larger payloads for AI responses
  maxHttpBufferSize: 1e7, // 10 MB (reduced for faster processing)
});

// Global Socket.IO error handler
io.engine.on("connection_error", (err) => {
  Logger.error("Socket.IO connection error", {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});

// JWT + Project validation middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.split(" ")[1]);

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    const projectId = socket.handshake.query.projectId;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid or missing projectId"));
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
      return next(new Error("Project not found"));
    }
    socket.project = project;

    next();
  } catch (error) {
    Logger.error("Socket authentication error", {
      error: error.message,
      stack: error.stack,
    });
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  try {
    socket.join(socket.project._id.toString());
    Logger.info("User connected to project", {
      projectId: socket.project._id.toString(),
      userId: socket.user?.email || "unknown",
    });
  } catch (error) {
    Logger.error("Error joining project room", { error });
  }

  socket.on("project-message", async (data) => {
    try {
      const message = data.message || "";
      socket.broadcast
        .to(socket.project._id.toString())
        .emit("project-message", data);

      if (message.toLowerCase().includes("@ai")) {
        const prompt = message.replace(/@ai/gi, "").trim();

        Logger.info("AI request received", {
          projectId: socket.project._id.toString(),
          promptLength: prompt.length,
          userId: socket.user?.email || "unknown",
        });

        const result = await generateResult(prompt);

        // Validate result has required structure
        if (!result || typeof result !== "object") {
          throw new Error("Invalid AI response format");
        }

        // Convert result object to JSON string
        const messageString = JSON.stringify(result);

        Logger.info("AI response sent", {
          projectId: socket.project._id.toString(),
          hasFileTree: !!result.fileTree,
          textLength: result.text?.length || 0,
        });

        io.to(socket.project._id.toString()).emit("project-message", {
          message: messageString,
          sender: { _id: "ai", email: "AI" },
        });
      }
    } catch (err) {
      Logger.error("Socket message error", {
        error: err,
        projectId: socket.project?._id,
        message: err.message,
      });

      // Send user-friendly error message as valid JSON
      const errorResponse = {
        text: "Sorry, I encountered an error processing your request. Please try again.",
        error: err.message,
        fileTree: {},
        buildCommand: null,
        startCommand: null,
      };

      io.to(socket.project._id.toString()).emit("project-message", {
        message: JSON.stringify(errorResponse),
        sender: { _id: "ai", email: "AI" },
      });
    }
  });

  socket.on("disconnect", () => {
    try {
      Logger.info("User disconnected from project", {
        projectId: socket.project?._id?.toString() || "unknown",
        userId: socket.user?.email || "unknown",
      });
      socket.leave(socket.project._id.toString());
    } catch (error) {
      Logger.error("Error during disconnect", { error });
    }
  });

  // Handle socket errors
  socket.on("error", (error) => {
    Logger.error("Socket error", {
      error,
      projectId: socket.project?._id?.toString(),
      userId: socket.user?.email,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
