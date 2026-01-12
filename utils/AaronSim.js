const fs = require("fs").promises;
const path = require("path");
const TASKS_FILE = path.join("utils", "tasks.json");

// Suppress noisy error logging during tests (Jest sets NODE_ENV=test)
const isTestEnv = process.env.NODE_ENV === "test";
const logError = (...args) => {
  if (!isTestEnv) {
    console.error(...args);
  }
};

/**
 * DELETE Task - High Complexity Implementation
 *
 * Success Scenario:
 * - Task exists and is successfully deleted
 *
 * Error Scenarios:
 * 1. Task ID not provided (400 Bad Request)
 * 2. Task ID not found in database (404 Not Found)
 * 3. File system errors (500 Internal Server Error)
 * 4. Invalid JSON in tasks.json (500 Internal Server Error)
 * 5. Task ID is invalid format (400 Bad Request)
 */
async function deleteTask(req, res) {
  const taskId = req.params.id;

  // Error Case 1: Task ID is missing
  if (!taskId) {
    return res.status(400).json({
      message: "Task ID is required for deletion.",
      error: "MISSING_TASK_ID",
    });
  }

  // Error Case 5: Task ID validation - should be numeric string
  if (!/^\d+$/.test(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID format. Task ID must be numeric.",
      error: "INVALID_TASK_ID_FORMAT",
      providedId: taskId,
    });
  }

  let allTasks = [];

  try {
    // Attempt to read the tasks file
    const data = await fs.readFile(TASKS_FILE, "utf8");

    try {
      allTasks = JSON.parse(data);
    } catch (parseError) {
      // Error Case 4: Invalid JSON in tasks.json
      logError("JSON parse error:", parseError);
      return res.status(500).json({
        message: "Database file is corrupted. Unable to parse tasks data.",
        error: "INVALID_JSON",
        details: parseError.message,
      });
    }
  } catch (error) {
    // Error Case 3: File system errors
    if (error.code === "ENOENT") {
      // File doesn't exist - treat as no tasks available
      return res.status(404).json({
        message: "Tasks database file not found.",
        error: "DATABASE_NOT_FOUND",
      });
    } else if (error.code === "EACCES") {
      // Permission denied
      logError("File access error:", error);
      return res.status(500).json({
        message: "Permission denied accessing tasks database.",
        error: "FILE_ACCESS_DENIED",
      });
    } else {
      // Other file system errors
      logError("Error reading tasks file:", error);
      return res.status(500).json({
        message: "Error accessing tasks database.",
        error: "FILE_READ_ERROR",
        details: error.message,
      });
    }
  }

  // Ensure allTasks is an array
  if (!Array.isArray(allTasks)) {
    return res.status(500).json({
      message: "Invalid database structure. Expected an array of tasks.",
      error: "INVALID_DATABASE_STRUCTURE",
    });
  }

  // Find the task index
  const taskIndex = allTasks.findIndex((task) => task.id === taskId);

  // Error Case 2: Task not found
  if (taskIndex === -1) {
    return res.status(404).json({
      message: `Task with ID ${taskId} not found.`,
      error: "TASK_NOT_FOUND",
      taskId: taskId,
      availableTaskCount: allTasks.length,
    });
  }

  // Get the task before deletion for confirmation response
  const deletedTask = allTasks[taskIndex];

  // Remove the task from the array
  allTasks.splice(taskIndex, 1);

  // Write the updated array back to the file
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify(allTasks, null, 2), "utf8");

    // Success Response
    return res.status(200).json({
      message: "Task deleted successfully.",
      deletedTask: deletedTask,
      remainingTasksCount: allTasks.length,
    });
  } catch (error) {
    // Error Case 3: File write errors
    logError("Error writing tasks file after deletion:", error);

    if (error.code === "EACCES") {
      return res.status(500).json({
        message: "Permission denied writing to tasks database.",
        error: "FILE_WRITE_PERMISSION_DENIED",
      });
    } else if (error.code === "ENOSPC") {
      return res.status(500).json({
        message: "Insufficient disk space to save changes.",
        error: "DISK_SPACE_ERROR",
      });
    } else {
      return res.status(500).json({
        message: "Error saving changes to database after deletion.",
        error: "FILE_WRITE_ERROR",
        details: error.message,
      });
    }
  }
}

module.exports = { deleteTask };
