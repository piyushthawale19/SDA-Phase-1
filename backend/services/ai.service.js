import { GoogleGenerativeAI } from "@google/generative-ai";
import Logger from "./logger.service.js";

// Validate API key exists
if (!process.env.GOOGLE_AI_KEY) {
  Logger.error("GOOGLE_AI_KEY is not configured in environment variables", {
    impact: "AI features will not work",
    action: "Set GOOGLE_AI_KEY in environment variables",
  });
  console.error(
    "⚠️  WARNING: GOOGLE_AI_KEY is not set. AI features will not work!"
  );
}

// Initialize AI with configuration logging
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
Logger.info("GoogleGenerativeAI initialized", {
  hasApiKey: !!process.env.GOOGLE_AI_KEY,
  timestamp: new Date().toISOString(),
});

const SYSTEM_PROMPT = `You are an expert MERN stack architect. Generate ORIGINAL codebases rapidly while following instructions exactly.

CRITICAL RESPONSE REQUIREMENTS:
- ALWAYS return syntactically valid JSON. Never include stray text, markdown fences, or explanations outside the JSON object.
- Escape newlines as \\n, tabs as \\t, and quotes as \\" inside strings.
- Filenames must be flat (no folders, no slashes). At most 8 files.
- For each file, provide its contents under fileTree["name"].file.contents as a string.
- If you cannot fulfill the request, still return a valid JSON object with an "error" field describing the issue and an empty fileTree.
- GENERATE ORIGINAL CODE - avoid copying existing implementations verbatim. Modify variable names, structure, and comments to ensure originality. Use unique identifiers, different patterns, and original implementations to prevent content recitation blocks.

REQUIRED JSON SHAPE:
{
  "text": string, // short summary of what you produced
  "fileTree": {
    "filename.ext": {
      "file": {
        "contents": string // complete file contents with escaped characters
      }
    }
  },
  "buildCommand": {
    "mainItem": string,
    "commands": string[]
  },
  "startCommand": {
    "mainItem": string,
    "commands": string[]
  },
  "error"?: string
}

Never invent additional top-level properties. If the user does not supply build/start instructions, default to npm install and node server.js.`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.5,
    maxOutputTokens: 8192,
  },
  requestOptions: {
    timeout: 60000,
  },
});

/**
 * Sanitizes JSON string by escaping control characters
 * @param {string} jsonString - The JSON string to sanitize
 * @returns {string} - Sanitized JSON string
 */
const sanitizeJSONString = (jsonString) => {
  try {
    // First, try to parse as-is
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    Logger.warn("Attempting to fix malformed JSON", {
      errorMessage: error.message,
      jsonLength: jsonString.length,
      firstChars: jsonString.substring(0, 50),
    });

    try {
      // Replace all literal control characters (not already escaped)
      const sanitized = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

      // Verify the sanitized string is valid JSON
      JSON.parse(sanitized);

      Logger.info("Successfully sanitized JSON", {
        originalLength: jsonString.length,
        sanitizedLength: sanitized.length,
        charsRemoved: jsonString.length - sanitized.length,
        timestamp: new Date().toISOString(),
        sanitizationType: "control-chars-removal",
      });

      return sanitized;
    } catch (sanitizeError) {
      Logger.error("Failed to sanitize JSON", {
        originalError: error.message,
        sanitizeError: sanitizeError.message,
        jsonPreview: jsonString.substring(0, 500),
      });
      throw error; // Throw the original error
    }
  }
};

/**
 * Sanitizes the fileTree to ensure all paths are flat (no subdirectories)
 * @param {Object} fileTree - The fileTree object from AI response
 * @returns {Object} - Sanitized fileTree with flat paths
 */
const sanitizeFileTree = (fileTree) => {
  if (!fileTree || typeof fileTree !== "object") {
    return {};
  }

  const sanitized = {};

  for (const [path, content] of Object.entries(fileTree)) {
    // Check if path contains slashes (subdirectories)
    if (path.includes("/") || path.includes("\\")) {
      // Extract just the filename
      const filename = path.split(/[/\\]/).pop();

      // If filename already exists, append a number
      let uniqueFilename = filename;
      let counter = 1;
      while (sanitized[uniqueFilename]) {
        const nameParts = filename.split(".");
        const ext = nameParts.pop();
        const base = nameParts.join(".");
        uniqueFilename = `${base}-${counter}.${ext}`;
        counter++;
      }

      Logger.warn("Sanitized invalid file path", {
        original: path,
        sanitized: uniqueFilename,
      });

      sanitized[uniqueFilename] = content;
    } else {
      // Path is already flat, keep it as is
      sanitized[path] = content;
    }
  }

  return sanitized;
};

const RESERVED_RESPONSE_KEYS = new Set([
  "text",
  "fileTree",
  "files",
  "buildCommand",
  "startCommand",
  "error",
  "summary",
  "description",
  "metadata",
]);

/**
 * Normalises command objects and applies sensible defaults
 * @param {Object} command
 * @param {{mainItem: string, commands: string[]}} fallback
 * @returns {{mainItem: string, commands: string[]}}
 */
const normalizeCommand = (command, fallback) => {
  if (!command || typeof command !== "object") {
    return fallback;
  }

  const mainItem =
    typeof command.mainItem === "string" && command.mainItem.trim().length > 0
      ? command.mainItem.trim()
      : fallback.mainItem;

  const commands = Array.isArray(command.commands)
    ? command.commands.filter(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    : fallback.commands;

  return {
    mainItem,
    commands: commands.length > 0 ? commands : fallback.commands,
  };
};

/**
 * Ensures every file entry has the expected { file: { contents } } shape
 * @param {Object} fileTree
 * @returns {Object}
 */
const normalizeFileTreeStructure = (fileTree) => {
  if (!fileTree || typeof fileTree !== "object") {
    return {};
  }

  const normalized = {};

  for (const [fileName, rawValue] of Object.entries(fileTree)) {
    if (typeof fileName !== "string" || fileName.trim().length === 0) {
      continue;
    }

    let contents = null;

    if (typeof rawValue === "string") {
      contents = rawValue;
    } else if (rawValue && typeof rawValue === "object") {
      if (typeof rawValue.contents === "string") {
        contents = rawValue.contents;
      } else if (
        rawValue.file &&
        typeof rawValue.file === "object" &&
        typeof rawValue.file.contents === "string"
      ) {
        contents = rawValue.file.contents;
      } else if (typeof rawValue.file === "string") {
        contents = rawValue.file;
      }
    }

    if (typeof contents === "string") {
      normalized[fileName] = {
        file: {
          contents,
        },
      };
    }
  }

  return normalized;
};

/**
 * Normalises the raw AI response into the expected contract
 * @param {Object} raw
 * @returns {{text: string, fileTree: Object, buildCommand: Object, startCommand: Object, error?: string}}
 */
const normalizeAIResponse = (raw) => {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response format: Expected an object");
  }

  let text = typeof raw.text === "string" ? raw.text : null;
  if (!text) {
    if (typeof raw.summary === "string") {
      text = raw.summary;
    } else if (typeof raw.description === "string") {
      text = raw.description;
    }
  }

  let fileTreeSource =
    raw.fileTree && typeof raw.fileTree === "object" ? raw.fileTree : null;

  if (!fileTreeSource && raw.files && typeof raw.files === "object") {
    Logger.warn(
      "AI response used 'files' property instead of 'fileTree'. Normalizing structure."
    );
    fileTreeSource = raw.files;
  }

  if (!fileTreeSource) {
    const candidateEntries = Object.entries(raw).filter(([key, value]) => {
      if (RESERVED_RESPONSE_KEYS.has(key)) {
        return false;
      }

      if (typeof value === "string") {
        return true;
      }

      if (value && typeof value === "object") {
        if (typeof value.contents === "string") {
          return true;
        }

        if (value.file && typeof value.file === "object") {
          return typeof value.file.contents === "string";
        }
      }

      return false;
    });

    if (candidateEntries.length > 0) {
      Logger.warn(
        "AI response lacked 'fileTree'. Promoting top-level file entries automatically."
      );
      fileTreeSource = Object.fromEntries(candidateEntries);
    }
  }

  const normalizedFileTree = sanitizeFileTree(
    normalizeFileTreeStructure(fileTreeSource)
  );

  if (!text) {
    const fileCount = Object.keys(normalizedFileTree).length;
    text = fileCount
      ? `Generated ${fileCount} file${
          fileCount === 1 ? "" : "s"
        } for your request.`
      : "Processed your request.";
    Logger.warn("AI response missing 'text'. Using fallback summary.", {
      fileCount,
    });
  }

  const buildCommand = normalizeCommand(raw.buildCommand, {
    mainItem: "npm",
    commands: ["install"],
  });

  const startCommand = normalizeCommand(raw.startCommand, {
    mainItem: "node",
    commands: ["server.js"],
  });

  const normalizedResponse = {
    text,
    fileTree: normalizedFileTree,
    buildCommand,
    startCommand,
  };

  if (typeof raw.error === "string" && raw.error.trim().length > 0) {
    normalizedResponse.error = raw.error.trim();
  }

  return normalizedResponse;
};

/**
 * Detects whether the prompt explicitly requires certain files and ensures they exist
 * @param {string} prompt
 * @param {Record<string, any>} fileTree
 * @returns {string[]} missing files list
 */
const detectMissingRequiredFiles = (prompt, fileTree) => {
  if (!prompt || typeof prompt !== "string") {
    return [];
  }

  const lowerPrompt = prompt.toLowerCase();
  const keys = Object.keys(fileTree || {}).map((key) => key.toLowerCase());

  const requiredFiles = [];

  if (lowerPrompt.includes("package.json")) {
    requiredFiles.push("package.json");
  }

  if (lowerPrompt.includes("server.js")) {
    requiredFiles.push("server.js");
  }

  if (lowerPrompt.includes("index.html")) {
    requiredFiles.push("index.html");
  }

  if (lowerPrompt.includes("tailwind.css")) {
    requiredFiles.push("tailwind.css");
  }

  if (lowerPrompt.includes("vite.config.js")) {
    requiredFiles.push("vite.config.js");
  }

  const missing = requiredFiles.filter(
    (file) => !keys.includes(file.toLowerCase())
  );

  return [...new Set(missing)];
};

/**
 * Processes the AI response with error handling and retries
 * @param {string} prompt - The user's prompt
 * @returns {Promise<Object>} - The processed response
 */
export const generateResult = async (prompt) => {
  // Input validation
  if (!prompt) {
    Logger.warn("AI request with no prompt");
    return {
      text: "Please provide a prompt to generate code.",
      error: "Prompt is required",
      fileTree: {},
      buildCommand: null,
      startCommand: null,
    };
  }

  if (typeof prompt !== "string" || prompt.trim() === "") {
    Logger.warn("AI request with invalid prompt type", {
      promptType: typeof prompt,
    });
    return {
      text: "Please provide a valid text prompt.",
      error: "Prompt must be a non-empty string",
      fileTree: {},
      buildCommand: null,
      startCommand: null,
    };
  }

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      Logger.info("Generating AI response", {
        promptLength: prompt.length,
        attempt: retryCount + 1,
        promptPreview: prompt.substring(0, 100),
      });

      // Generate content from the AI model with 1 minute timeout
      const result = await Promise.race([
        (async () => {
          // Log the AI request attempt
          Logger.info("Initiating AI request", {
            promptLength: prompt.length,
            timestamp: new Date().toISOString(),
          });

          // Make the AI request
          const aiResponse = await model.generateContent(prompt);

          // Check if response was blocked
          if (
            aiResponse.response.candidates &&
            aiResponse.response.candidates[0]
          ) {
            const candidate = aiResponse.response.candidates[0];
            if (candidate.finishReason === "RECITATION") {
              throw new Error(
                "AI response was blocked due to content recitation policy. Please try rephrasing your request."
              );
            }
            if (candidate.finishReason === "SAFETY") {
              throw new Error(
                "AI response was blocked due to safety filters. Please try a different request."
              );
            }
          }

          const responseText = aiResponse.response.text();

          Logger.info("Raw AI response received", {
            responseLength: responseText.length,
            timestamp: new Date().toISOString(),
          });

          return { response: aiResponse.response, text: responseText };
        })(),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Request timeout after 1 minute - please try a simpler prompt"
                )
              ),
            60000 // 60 seconds = 1 minute
          )
        ),
      ]);

      if (!result || !result.response) {
        throw new Error("No response received from AI model");
      }

      const responseText = result.text;

      if (!responseText) {
        throw new Error("Empty response from AI model");
      }

      Logger.debug("AI raw response received", {
        responseLength: responseText.length,
      });

      // Check if response is too large (might cause JSON parsing issues)
      if (responseText.length > 1000000) {
        // 1MB limit
        Logger.warn("AI response is very large", {
          responseLength: responseText.length,
        });
      }

      // Parse and validate the response
      try {
        // Sanitize the JSON string before parsing
        const sanitizedJSON = sanitizeJSONString(responseText);
        const parsedResponse = JSON.parse(sanitizedJSON);
        const normalizedResponse = normalizeAIResponse(parsedResponse);

        const missingFiles = detectMissingRequiredFiles(
          prompt,
          normalizedResponse.fileTree
        );
        if (missingFiles.length > 0) {
          Logger.error("AI response missing required files", {
            missingFiles,
            promptSnippet: prompt.substring(0, 200),
          });
          throw new Error(
            `AI response did not include required file(s): ${missingFiles.join(
              ", "
            )}`
          );
        }

        Logger.info("AI response successfully generated", {
          hasFileTree:
            Object.keys(normalizedResponse.fileTree || {}).length > 0,
          textLength: normalizedResponse.text.length,
        });

        Logger.debug("Normalized AI files", {
          fileNames: Object.keys(normalizedResponse.fileTree || {}),
        });

        return normalizedResponse;
      } catch (parseError) {
        Logger.error("Error parsing AI response", {
          errorName: parseError.name,
          errorMessage: parseError.message,
          errorStack: parseError.stack,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 200),
          responseSuffix: responseText.substring(responseText.length - 200),
        });

        // Try to extract any error message from the response
        let errorMessage =
          "The AI response could not be understood. Please try rephrasing your request.";
        try {
          const errorMatch = responseText.match(/error[\s:]*([^\n\r]+)/i);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1].trim();
          }
        } catch (e) {
          // If we can't extract an error message, use the default
        }

        return {
          text: "Sorry, I couldn't process that request. Please try again with a different prompt.",
          error: errorMessage,
          fileTree: {},
          buildCommand: null,
          startCommand: null,
        };
      }
    } catch (error) {
      const isRetryableError =
        error.message?.includes("RECITATION") ||
        error.message?.includes("SAFETY") ||
        error.message?.includes("Empty response") ||
        error.message?.includes("No response received");

      if (isRetryableError && retryCount < maxRetries) {
        retryCount++;
        Logger.warn("Retryable AI error, attempting retry", {
          attempt: retryCount,
          error: error.message,
          promptSnippet: prompt.substring(0, 50),
        });

        // Add some variation to the prompt for retry
        const retryPrompt = `${prompt} (Attempt ${
          retryCount + 1
        }: Please generate original code with unique variable names and structure)`;

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        prompt = retryPrompt;
        continue;
      }

      Logger.error("Error in generateResult", {
        error: error,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        attempts: retryCount + 1,
      });

      // Handle specific error types
      let errorMessage =
        "An unexpected error occurred while generating your response.";
      let userMessage = "Sorry, I encountered an error. Please try again.";

      if (error.name === "AbortError") {
        errorMessage = "Request timed out";
        userMessage = "The request took too long. Please try a simpler prompt.";
      } else if (error.message?.includes("API key")) {
        errorMessage = "API key issue";
        userMessage = "There's a configuration issue. Please contact support.";
      } else if (error.message?.includes("RECITATION")) {
        errorMessage = "AI response blocked due to content recitation";
        userMessage =
          "The AI blocked this response due to content policies. Please try rephrasing your request.";
      } else if (error.message?.includes("SAFETY")) {
        errorMessage = "AI response blocked due to safety filters";
        userMessage =
          "The AI blocked this response due to safety filters. Please try a different request.";
      } else if (error.message?.toLowerCase().includes("required file")) {
        errorMessage = error.message;
        userMessage = error.message;
      } else if (
        error.message?.includes("quota") ||
        error.message?.includes("limit")
      ) {
        errorMessage = "API quota exceeded";
        userMessage =
          "The service is temporarily unavailable. Please try again later.";
      } else if (error.response) {
        // Handle API response errors
        errorMessage = `API Error: ${error.response.status}`;
        userMessage = "The AI service encountered an error. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        text: userMessage,
        error: errorMessage,
        fileTree: {},
        buildCommand: null,
        startCommand: null,
      };
    }
  }
};
