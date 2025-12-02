# Backend Logging System Documentation

## Overview

We've implemented a comprehensive logging system for the backend that saves errors and application events to files with automatic rotation and management capabilities.

## Features

### 1. **Logger Service** (`services/logger.service.js`)

A centralized logging service with multiple log levels:

- **ERROR**: For error messages and exceptions
- **WARN**: For warning messages
- **INFO**: For informational messages
- **DEBUG**: For debug messages (development only)

**Usage Example:**

```javascript
import Logger from "../services/logger.service.js";

// Log an error
Logger.error("Database connection failed", error);

// Log info
Logger.info("User logged in successfully", { userId: user.id });

// Log warning
Logger.warn("API rate limit approaching", { currentRate: 95 });
```

### 2. **Request Logging Middleware** (`middleware/request-logger.middleware.js`)

Automatically logs all incoming API requests and their responses including:

- HTTP method and URL
- IP address and user agent
- Request/response time
- Status codes

### 3. **Error Logging Middleware** (`middleware/error.middleware.js`)

Enhanced error handling that logs all errors with:

- Stack traces
- Request context (body, params, query)
- User information
- Timestamp

### 4. **Log Rotation** (`utils/log-rotation.util.js`)

Automatic log file rotation when files exceed 10MB:

- Archives old logs with timestamps
- Maintains up to 10 archived log files
- Automatically cleans up oldest archives

### 5. **Log Viewer Utility** (`utils/log-viewer.util.js`)

Utilities for reading and filtering log files:

- Read log files with line limits
- Filter by log level (ERROR, WARN, INFO, DEBUG)
- Filter by date range
- Search logs by keyword
- List all available log files
- Format file sizes

### 6. **Logs Management API**

Admin-only endpoints for viewing and managing logs:

**GET /admin/logs**

- Lists all available log files with metadata

**GET /admin/logs/:filename**

- Retrieves log file contents
- Supports filtering by level, search term, and date range
- Query parameters:
  - `maxLines`: Number of recent lines to return (default: 100)
  - `level`: Filter by log level (ERROR, WARN, INFO, DEBUG)
  - `search`: Search term to filter logs
  - `startDate`, `endDate`: Date range filter

**DELETE /admin/logs/:filename**

- Clears a log file (main logs only, not archives)

## File Structure

```
backend/
├── logs/                         # Log files directory (auto-created)
│   ├── error.log                 # Error logs
│   ├── info.log                  # Info, warn, and debug logs
│   └── archive/                  # Archived logs (auto-created)
│       ├── error-2025-11-07-143022.log
│       └── info-2025-11-07-143022.log
├── services/
│   └── logger.service.js         # Main logger service
├── middleware/
│   ├── error.middleware.js       # Error handling with logging
│   └── request-logger.middleware.js  # Request/response logging
├── utils/
│   ├── log-rotation.util.js      # Log rotation logic
│   └── log-viewer.util.js        # Log reading utilities
├── controllers/
│   └── logs.controller.js        # Logs API controller
└── routes/
    └── logs.routes.js            # Logs API routes
```

## Configuration

### Environment Variables

```env
LOG_LEVEL=INFO                    # Logging level (ERROR, WARN, INFO, DEBUG)
NODE_ENV=development              # Environment (development/production)
```

### Log Rotation Settings

Located in `utils/log-rotation.util.js`:

```javascript
const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 10; // Keep 10 archives
```

## Log Format

Each log entry includes:

```
[yyyy-MM-dd HH:mm:ss.SSS] [LEVEL] Message
  Details: { ... }
  Stack: Error stack trace (for errors)
```

**Example:**

```
[2025-11-07 14:30:22.123] [ERROR] Database connection failed
  Error: Connection timeout
  Stack: Error: Connection timeout
    at Object.connect (/path/to/db.js:45:15)
    ...
```

## Security

- Log routes are protected by authentication middleware
- Only users with `admin` role can access logs
- Filename validation prevents directory traversal attacks
- Sensitive data can be filtered based on NODE_ENV

## Integration Points

### In Server.js

```javascript
import Logger from "./services/logger.service.js";

// Log server startup
Logger.info("Application starting up");

// Log errors
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception", error);
});
```

### In App.js

```javascript
import requestLogger from "./middleware/request-logger.middleware.js";
import logsRoutes from "./routes/logs.routes.js";

// Add request logging
app.use(requestLogger);

// Add logs routes
app.use("/admin/logs", logsRoutes);
```

### In Controllers

```javascript
import Logger from "../services/logger.service.js";

export const someController = async (req, res) => {
  try {
    // ... controller logic
    Logger.info("Operation completed successfully", { userId: req.user.id });
  } catch (error) {
    Logger.error("Operation failed", error);
    throw error;
  }
};
```

## Benefits

1. **Centralized Logging**: All logs in one place with consistent format
2. **Error Tracking**: Comprehensive error logging with stack traces
3. **Performance Monitoring**: Request/response time tracking
4. **Debugging**: Detailed context for troubleshooting
5. **Audit Trail**: Complete record of system events
6. **Automatic Management**: Log rotation prevents disk space issues
7. **Production Ready**: Different log levels for dev/prod environments
8. **Admin Dashboard**: API endpoints for log viewing and management

## Best Practices

1. Use appropriate log levels:

   - **ERROR**: Unexpected failures
   - **WARN**: Recoverable issues
   - **INFO**: Important events
   - **DEBUG**: Detailed debugging (dev only)

2. Include context:

   ```javascript
   Logger.error("Failed to process payment", {
     orderId: order.id,
     amount: payment.amount,
     error: error.message,
   });
   ```

3. Avoid logging sensitive data in production:

   ```javascript
   Logger.info("User action", {
     userId: user.id,
     // Don't log: password, tokens, credit cards, etc.
   });
   ```

4. Monitor log file sizes regularly
5. Set up alerts for critical errors
6. Regularly review logs for security issues

## Future Enhancements

Potential improvements:

- Remote log aggregation (e.g., ELK stack, Datadog)
- Real-time log streaming via WebSockets
- Email notifications for critical errors
- Log analytics and visualization dashboard
- Integration with monitoring services (e.g., Sentry, LogRocket)
- Compressed log archives
- Cloud storage integration for long-term retention

## Dependencies

```json
{
  "date-fns": "^2.30.0" // For date formatting
}
```

Install with:

```bash
npm install date-fns
```

## Troubleshooting

### Logs not being created

- Check if `logs/` directory exists
- Verify file permissions
- Check LOG_LEVEL environment variable

### Log rotation not working

- Verify log file size exceeds MAX_LOG_SIZE_BYTES
- Check archive directory permissions
- Review console for rotation errors

### Cannot access log API

- Verify user has admin role
- Check authentication token
- Ensure logs routes are registered in app.js

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
