/**
 * Logs routes
 * Routes for accessing and managing application logs
 */

import express from "express";
import {
  getLogsList,
  getLogContent,
  clearLog,
} from "../controllers/logs.controller.js";

// Import auth middleware to protect log routes
import { authUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes should be admin-only
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// Get list of available logs
router.get("/", authUser, adminOnly, getLogsList);

// Get contents of a specific log file
router.get("/:filename", authUser, adminOnly, getLogContent);

// Clear a log file
router.delete("/:filename", authUser, adminOnly, clearLog);

export default router;
