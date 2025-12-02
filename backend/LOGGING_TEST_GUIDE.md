# Logging System - Quick Test Guide

## Testing the Logging System

### 1. Trigger Application Startup Logs

The server automatically logs startup events. Check the terminal output and the logs directory should be created.

### 2. Test API Request Logging

Make any API request to trigger request/response logging:

```bash
# Health check
curl http://localhost:8080/

# Login (triggers both request and response logs)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 3. Test Error Logging

Trigger an error to see error logging in action:

```bash
# Invalid route (404 error)
curl http://localhost:8080/invalid-route

# Invalid data (validation error)
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. View Logs via API (Admin Only)

**Note**: You need to be logged in as an admin user.

```bash
# Get list of all log files
curl http://localhost:8080/admin/logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# View error log (last 100 lines)
curl http://localhost:8080/admin/logs/error.log \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# View info log with filters
curl "http://localhost:8080/admin/logs/info.log?level=INFO&maxLines=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Search logs
curl "http://localhost:8080/admin/logs/error.log?search=Database" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by date range
curl "http://localhost:8080/admin/logs/info.log?startDate=2025-11-07&endDate=2025-11-08" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Check Log Files Directly

```bash
# Windows PowerShell
cd "D:\Downloads\Desktop\Final Year\SDA\backend"
Get-Content logs\info.log -Tail 50
Get-Content logs\error.log -Tail 50

# Or using type command
type logs\info.log
type logs\error.log
```

### 6. Test Log Rotation

To test log rotation (files rotate when they exceed 10MB):

```javascript
// Create a test script to generate large logs
import Logger from "./services/logger.service.js";

for (let i = 0; i < 100000; i++) {
  Logger.info("Test log entry", { iteration: i, data: "x".repeat(100) });
}
```

## Expected Log File Structure

After running some tests, you should see:

```
backend/
└── logs/
    ├── error.log      # Contains ERROR level logs
    ├── info.log       # Contains INFO, WARN, DEBUG logs
    └── archive/       # Created when logs are rotated
        ├── error-2025-11-07-143022.log
        └── info-2025-11-07-143022.log
```

## Verifying Logs

### Check Info Logs

Info logs should contain:

- Server startup messages
- API request/response logs
- General application events

### Check Error Logs

Error logs should contain:

- Caught exceptions with stack traces
- Database errors
- API errors
- Validation failures

## Sample Log Entries

### Info Log Entry:

```
[2025-11-07 14:30:22.123] [INFO] Application starting up
[2025-11-07 14:30:22.456] [INFO] Server running on port 8080
  Details: {
    "port": 8080,
    "environment": "development",
    "mongodbConnected": true
  }
[2025-11-07 14:30:25.789] [INFO] Request: GET /projects/all
  Details: {
    "ip": "::1",
    "userAgent": "Mozilla/5.0...",
    "userId": "anonymous"
  }
```

### Error Log Entry:

```
[2025-11-07 14:35:10.123] [ERROR] Error [GET /projects/all]
  Error: Database query failed
  Stack: Error: Database query failed
    at ProjectService.findAll (/path/to/project.service.js:45:15)
    at ProjectController.getAll (/path/to/project.controller.js:23:7)
    ...
  Details: {
    "error": {...},
    "requestBody": {},
    "requestParams": {},
    "requestQuery": {},
    "user": "unauthenticated"
  }
```

## Troubleshooting

### Logs Directory Not Created

- The directory is created automatically on first log entry
- If it doesn't exist, restart the server to trigger startup logs

### No Logs Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify logger is imported correctly
3. Check file permissions in backend directory
4. Look for console error messages

### Cannot Access Log API

1. Ensure you're logged in as admin
2. Check the admin role is set correctly in user model
3. Verify authentication token is valid
4. Check middleware is properly configured

## Next Steps

1. Monitor logs regularly for errors
2. Set up log rotation monitoring
3. Consider integrating with external logging service
4. Create alerting for critical errors
5. Build a frontend dashboard for log viewing (optional)
