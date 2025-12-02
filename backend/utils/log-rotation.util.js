/**
 * Log rotation utility for managing log files
 */

import fs from "fs";
import path from "path";
import { format } from "date-fns";

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 10; // Maximum number of archived log files

/**
 * Checks if a log file needs rotation and rotates it if needed
 * @param {string} logFilePath Path to the log file to check
 */
const checkAndRotateLog = (logFilePath) => {
  try {
    // If file doesn't exist, no rotation needed
    if (!fs.existsSync(logFilePath)) {
      return;
    }

    const stats = fs.statSync(logFilePath);

    // Check if file exceeds max size
    if (stats.size >= MAX_LOG_SIZE_BYTES) {
      // Get file directory and name
      const dir = path.dirname(logFilePath);
      const baseName = path.basename(logFilePath);
      const ext = path.extname(logFilePath);
      const nameWithoutExt = baseName.replace(ext, "");

      // Create archive filename with timestamp
      const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
      const archiveFileName = `${nameWithoutExt}-${timestamp}${ext}`;
      const archiveFilePath = path.join(dir, "archive", archiveFileName);

      // Create archive directory if it doesn't exist
      const archiveDir = path.join(dir, "archive");
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Rename current log file to archive name
      fs.renameSync(logFilePath, archiveFilePath);

      // Create a new empty log file
      fs.writeFileSync(logFilePath, "", { encoding: "utf8" });

      // Clean up old log files if there are too many
      cleanOldLogFiles(archiveDir, nameWithoutExt, ext);

      console.log(`Rotated log file: ${logFilePath} -> ${archiveFilePath}`);
    }
  } catch (err) {
    console.error("Error during log rotation:", err);
  }
};

/**
 * Deletes the oldest log files if there are too many
 * @param {string} archiveDir Directory containing archived logs
 * @param {string} baseFileName Base name of log file without extension
 * @param {string} ext File extension
 */
const cleanOldLogFiles = (archiveDir, baseFileName, ext) => {
  try {
    // Get all archived log files for this log type
    const regex = new RegExp(
      `^${baseFileName}-\\d{4}-\\d{2}-\\d{2}-\\d{6}${ext.replace(".", "\\.")}$`
    );

    const files = fs
      .readdirSync(archiveDir)
      .filter((file) => regex.test(file))
      .map((file) => ({
        name: file,
        path: path.join(archiveDir, file),
        time: fs.statSync(path.join(archiveDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by modification time (newest first)

    // Delete oldest files if there are too many
    if (files.length > MAX_LOG_FILES) {
      files.slice(MAX_LOG_FILES).forEach((file) => {
        fs.unlinkSync(file.path);
        console.log(`Deleted old log file: ${file.path}`);
      });
    }
  } catch (err) {
    console.error("Error cleaning old log files:", err);
  }
};

export { checkAndRotateLog };
