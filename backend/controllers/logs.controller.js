/**
 * Logs controller for managing and viewing application logs
 */

import fs from "fs";
import { ApiError, asyncHandler } from "../middleware/error.middleware.js";
import logViewer from "../utils/log-viewer.util.js";

/**
 * Get list of available log files
 * @route GET /api/admin/logs
 * @access Admin
 */
const getLogsList = asyncHandler(async (req, res) => {
  const logFiles = logViewer.getLogFilesList();

  // Format the response
  const formattedLogs = logFiles.map((log) => ({
    name: log.name,
    path: log.path.split("logs/")[1] || log.path.split("logs\\")[1], // Handle both Unix and Windows paths
    size: logViewer.formatFileSize(log.size),
    lastModified: log.lastModified,
  }));

  res.status(200).json({
    success: true,
    data: formattedLogs,
  });
});

/**
 * Get contents of a specific log file
 * @route GET /api/admin/logs/:filename
 * @access Admin
 */
const getLogContent = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const { maxLines = 100, level, search, startDate, endDate } = req.query;

  // Validate and sanitize the filename to prevent directory traversal
  if (!filename || filename.includes("..")) {
    throw ApiError.badRequest("Invalid log filename");
  }

  // Determine the full path to the log file
  let logPath;
  if (filename === "error.log") {
    logPath = logViewer.ERROR_LOG_FILE;
  } else if (filename === "info.log") {
    logPath = logViewer.INFO_LOG_FILE;
  } else if (
    filename.startsWith("archive/") ||
    filename.startsWith("archive\\")
  ) {
    // Handle archived logs
    const archivePath = filename
      .replace("archive/", "")
      .replace("archive\\", "");
    if (archivePath.includes("..")) {
      throw ApiError.badRequest("Invalid log filename");
    }

    const parts = filename.split(/[/\\]/);
    if (parts.length !== 2) {
      throw ApiError.badRequest("Invalid archive log path");
    }

    logPath = `${logViewer.ERROR_LOG_FILE.replace("error.log", "archive/")}${
      parts[1]
    }`;
  } else {
    throw ApiError.badRequest("Unknown log file");
  }

  // Read the log file
  let logLines = logViewer.readLogFile(logPath, parseInt(maxLines, 10));

  // Apply filters if specified
  if (level) {
    logLines = logViewer.filterLogsByLevel(logLines, level.toUpperCase());
  }

  if (search) {
    logLines = logViewer.searchLogs(logLines, search);
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ApiError.badRequest("Invalid date format");
    }

    logLines = logViewer.filterLogsByDate(logLines, start, end);
  }

  res.status(200).json({
    success: true,
    data: {
      filename,
      lines: logLines,
      totalLines: logLines.length,
    },
  });
});

/**
 * Clear a log file
 * @route DELETE /api/admin/logs/:filename
 * @access Admin
 */
const clearLog = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Validate and sanitize the filename to prevent directory traversal
  if (!filename || filename.includes("..")) {
    throw ApiError.badRequest("Invalid log filename");
  }

  // Only allow clearing main log files, not archives
  if (filename !== "error.log" && filename !== "info.log") {
    throw ApiError.forbidden("Cannot clear archived log files");
  }

  // Determine the full path to the log file
  const logPath =
    filename === "error.log"
      ? logViewer.ERROR_LOG_FILE
      : logViewer.INFO_LOG_FILE;

  try {
    // Clear the log file by writing an empty string
    await fs.promises.writeFile(logPath, "", "utf8");

    res.status(200).json({
      success: true,
      message: `Log file ${filename} has been cleared`,
    });
  } catch (error) {
    throw ApiError.internal(`Failed to clear log file: ${error.message}`);
  }
});

export { getLogsList, getLogContent, clearLog };
