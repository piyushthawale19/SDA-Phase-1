/**
 * Log viewer utility for the backend
 * Provides a simple interface to view and filter log files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to log directory
const LOG_DIR = path.join(__dirname, "..", "logs");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");
const INFO_LOG_FILE = path.join(LOG_DIR, "info.log");

/**
 * Read a log file and return its contents
 * @param {string} logPath - Path to the log file
 * @param {number} maxLines - Maximum number of lines to read (from the end)
 * @returns {string[]} Array of log lines
 */
export const readLogFile = (logPath, maxLines = 100) => {
  try {
    if (!fs.existsSync(logPath)) {
      return [`Log file does not exist: ${logPath}`];
    }

    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());

    // Return the last maxLines lines (most recent logs first)
    return lines.slice(-maxLines).reverse();
  } catch (error) {
    return [`Error reading log file: ${error.message}`];
  }
};

/**
 * Filter log entries by level
 * @param {string[]} logLines - Array of log lines
 * @param {string} level - Log level to filter by (ERROR, WARN, INFO, DEBUG)
 * @returns {string[]} Filtered log lines
 */
export const filterLogsByLevel = (logLines, level) => {
  const levelPattern = new RegExp(`\\[${level}\\]`);
  return logLines.filter((line) => levelPattern.test(line));
};

/**
 * Filter log entries by date range
 * @param {string[]} logLines - Array of log lines
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {string[]} Filtered log lines
 */
export const filterLogsByDate = (logLines, startDate, endDate) => {
  return logLines.filter((line) => {
    // Extract the timestamp from the log line [yyyy-MM-dd HH:mm:ss.SSS]
    const timestampMatch = line.match(/\[([\d-]+\s[\d:.]+)\]/);
    if (!timestampMatch) return false;

    const logDate = new Date(timestampMatch[1]);
    return logDate >= startDate && logDate <= endDate;
  });
};

/**
 * Search logs for a specific term
 * @param {string[]} logLines - Array of log lines
 * @param {string} searchTerm - Term to search for
 * @returns {string[]} Filtered log lines
 */
export const searchLogs = (logLines, searchTerm) => {
  const searchPattern = new RegExp(searchTerm, "i");
  return logLines.filter((line) => searchPattern.test(line));
};

/**
 * Get a list of all available log files
 * @returns {Object[]} Array of log file information objects
 */
export const getLogFilesList = () => {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      return [];
    }

    const logFiles = fs
      .readdirSync(LOG_DIR)
      .filter((file) => file.endsWith(".log"))
      .map((file) => {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          lastModified: stats.mtime,
        };
      });

    // Get archived logs too
    const archiveDir = path.join(LOG_DIR, "archive");
    if (fs.existsSync(archiveDir)) {
      const archivedFiles = fs
        .readdirSync(archiveDir)
        .filter((file) => file.endsWith(".log"))
        .map((file) => {
          const filePath = path.join(archiveDir, file);
          const stats = fs.statSync(filePath);

          return {
            name: `archive/${file}`,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime,
          };
        });

      logFiles.push(...archivedFiles);
    }

    return logFiles.sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error("Error listing log files:", error);
    return [];
  }
};

/**
 * Format log files sizes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

export default {
  readLogFile,
  filterLogsByLevel,
  filterLogsByDate,
  searchLogs,
  getLogFilesList,
  formatFileSize,
  ERROR_LOG_FILE,
  INFO_LOG_FILE,
};
