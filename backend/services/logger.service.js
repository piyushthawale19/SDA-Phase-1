/**
 * Logger Service
 * Handles logging of errors and other application events to files
 */

import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { checkAndRotateLog } from "../utils/log-rotation.util.js";

// Define log levels
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

// Configure log directory
const LOG_DIR = path.join(process.cwd(), "logs");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");
const INFO_LOG_FILE = path.join(LOG_DIR, "info.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Formats a log entry with timestamp and additional details
 */
const formatLogEntry = (level, message, details = null) => {
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");

  let logEntry = `[${timestamp}] [${level}] ${message}`;

  if (details) {
    // Handle different types of details
    if (details instanceof Error) {
      logEntry += `\n  Stack: ${details.stack || "No stack trace"}`;

      // Add any custom properties from the error
      const customProps = Object.entries(details)
        .filter(([key]) => !["name", "message", "stack"].includes(key))
        .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
        .join("\n");

      if (customProps) logEntry += `\n${customProps}`;
    } else if (typeof details === "object") {
      logEntry += `\n  Details: ${JSON.stringify(details, null, 2)}`;
    } else {
      logEntry += `\n  Details: ${details}`;
    }
  }

  return logEntry + "\n";
};

/**
 * Writes a log entry to the specified file
 */
const writeToLog = (filePath, entry) => {
  try {
    // Check if log file needs rotation before writing
    checkAndRotateLog(filePath);

    // Append the log entry to the file
    fs.appendFileSync(filePath, entry);
  } catch (err) {
    // If writing to log file fails, write to console as fallback
    console.error("Failed to write to log file:", err);
    console.log(entry);
  }
};

/**
 * Logger class with methods for different log levels
 */
class Logger {
  /**
   * Log an error message and details
   */
  static error(message, details = null) {
    const entry = formatLogEntry(LOG_LEVELS.ERROR, message, details);
    writeToLog(ERROR_LOG_FILE, entry);

    // In development, also log to console
    if (process.env.NODE_ENV !== "production") {
      console.error(message, details);
    }
  }

  /**
   * Log a warning message
   */
  static warn(message, details = null) {
    const entry = formatLogEntry(LOG_LEVELS.WARN, message, details);
    writeToLog(INFO_LOG_FILE, entry);

    // In development, also log to console
    if (process.env.NODE_ENV !== "production") {
      console.warn(message, details);
    }
  }

  /**
   * Log an info message
   */
  static info(message, details = null) {
    const entry = formatLogEntry(LOG_LEVELS.INFO, message, details);
    writeToLog(INFO_LOG_FILE, entry);

    // In development, also log to console
    if (process.env.NODE_ENV !== "production") {
      console.info(message, details);
    }
  }

  /**
   * Log a debug message (only in development)
   */
  static debug(message, details = null) {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== "production") {
      const entry = formatLogEntry(LOG_LEVELS.DEBUG, message, details);
      writeToLog(INFO_LOG_FILE, entry);
      console.debug(message, details);
    }
  }

  /**
   * Log an API request
   */
  static logRequest(req) {
    const { method, originalUrl, ip, headers, body } = req;
    this.info(`API Request: ${method} ${originalUrl}`, {
      ip,
      userAgent: headers["user-agent"],
      body: process.env.NODE_ENV === "development" ? body : undefined,
    });
  }

  /**
   * Log an API response
   */
  static logResponse(req, res, responseTime) {
    const { method, originalUrl } = req;
    const { statusCode } = res;

    this.info(`API Response: ${method} ${originalUrl}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }
}

export default Logger;
