/**
 * Test Script for Logging System
 * Run this to verify that logging is working correctly
 */

import Logger from "./services/logger.service.js";

console.log("\n🧪 Starting Logging System Test...\n");

// Test 1: INFO level logging
console.log("📝 Test 1: INFO Level Logging");
Logger.info("Testing INFO level logging", {
  testId: 1,
  timestamp: new Date().toISOString(),
  testType: "info",
});

// Test 2: WARN level logging
console.log("📝 Test 2: WARN Level Logging");
Logger.warn("Testing WARN level logging", {
  testId: 2,
  timestamp: new Date().toISOString(),
  warningType: "test-warning",
});

// Test 3: ERROR level logging
console.log("📝 Test 3: ERROR Level Logging");
const testError = new Error(
  "This is a test error - everything is working fine!"
);
testError.testId = 3;
Logger.error("Testing ERROR level logging", testError);

// Test 4: DEBUG level logging
console.log("📝 Test 4: DEBUG Level Logging");
Logger.debug("Testing DEBUG level logging", {
  testId: 4,
  timestamp: new Date().toISOString(),
  debugInfo: "This should only appear in development mode",
});

// Test 5: Complex object logging
console.log("📝 Test 5: Complex Object Logging");
Logger.info("Testing complex object logging", {
  testId: 5,
  user: {
    id: "test-user-123",
    name: "Test User",
    email: "test@example.com",
  },
  metadata: {
    browser: "Chrome",
    os: "Windows",
    version: "1.0.0",
  },
  arrays: [1, 2, 3, 4, 5],
  timestamp: new Date().toISOString(),
});

console.log("\n✅ Test Complete!\n");
console.log("📂 Check the following files:");
console.log(
  "   - backend/logs/info.log (should contain INFO, WARN, DEBUG logs)"
);
console.log("   - backend/logs/error.log (should contain ERROR logs)");
console.log("\n💡 Tip: Use these commands to view logs:");
console.log("   Windows: type logs\\info.log");
console.log("   Windows: type logs\\error.log");
console.log("   or");
console.log("   PowerShell: Get-Content logs\\info.log -Tail 20");
console.log("   PowerShell: Get-Content logs\\error.log -Tail 20\n");
