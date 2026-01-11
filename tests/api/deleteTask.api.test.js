/**
 * API Tests for Delete Task Endpoint
 * Tests HTTP behavior via Express routes using Supertest
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

const TASKS_FILE = path.join(__dirname, '../../utils/tasks.json');
const TASKS_BACKUP = path.join(__dirname, '../../utils/tasks.backup.json');

// Sample task data for testing
const sampleTasks = [
  {
    id: '1234567890123',
    title: 'Test Task 1',
    description: 'Description 1',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-12-31'
  },
  {
    id: '9876543210987',
    title: 'Test Task 2',
    description: 'Description 2',
    status: 'completed',
    priority: 'low',
    dueDate: '2025-11-30'
  }
];

describe('DELETE /delete-task/:id API', () => {
  let app;
  let server;
  let originalTasksExist = false;
  let originalTasks = null;

  beforeAll(async () => {
    // Check if tasks.json exists and backup if so
    try {
      originalTasks = await fs.readFile(TASKS_FILE, 'utf8');
      originalTasksExist = true;
      await fs.writeFile(TASKS_BACKUP, originalTasks, 'utf8');
    } catch (err) {
      originalTasksExist = false;
    }

    // Import app after potential env setup
    const appModule = require('../../index');
    app = appModule.app;
    server = appModule.server;
  });

  afterAll(async () => {
    // Restore original tasks.json or remove test file
    if (originalTasksExist && originalTasks) {
      await fs.writeFile(TASKS_FILE, originalTasks, 'utf8');
      try {
        await fs.unlink(TASKS_BACKUP);
      } catch (e) {
        // Ignore if backup doesn't exist
      }
    } else {
      try {
        await fs.unlink(TASKS_FILE);
      } catch (e) {
        // Ignore if file doesn't exist
      }
    }

    // Close the server
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Reset tasks file with sample data before each test
    await fs.writeFile(TASKS_FILE, JSON.stringify(sampleTasks, null, 2), 'utf8');
  });

  describe('Success Cases (200)', () => {
    test('should successfully delete an existing task', async () => {
      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(200);

      expect(response.body.message).toBe('Task deleted successfully.');
      expect(response.body.deletedTask).toBeDefined();
      expect(response.body.deletedTask.id).toBe('1234567890123');
      expect(response.body.deletedTask.title).toBe('Test Task 1');
    });

    test('should return remainingTasksCount in response', async () => {
      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(200);

      expect(response.body.remainingTasksCount).toBe(1);
    });

    test('should return deleted task with all properties', async () => {
      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(200);

      const deletedTask = response.body.deletedTask;
      expect(deletedTask.id).toBeDefined();
      expect(deletedTask.title).toBeDefined();
      expect(deletedTask.description).toBeDefined();
      expect(deletedTask.status).toBeDefined();
      expect(deletedTask.priority).toBeDefined();
      expect(deletedTask.dueDate).toBeDefined();
    });

    test('should actually remove the task from the file', async () => {
      await request(app)
        .delete('/delete-task/1234567890123')
        .expect(200);

      // Read the file and verify task is removed
      const data = await fs.readFile(TASKS_FILE, 'utf8');
      const tasks = JSON.parse(data);
      expect(tasks).toHaveLength(1);
      expect(tasks.find(t => t.id === '1234567890123')).toBeUndefined();
    });
  });

  describe('Bad Request Cases (400)', () => {
    test('should return 400 for non-numeric task ID', async () => {
      const response = await request(app)
        .delete('/delete-task/abc')
        .expect(400);

      expect(response.body.error).toBe('INVALID_TASK_ID_FORMAT');
      expect(response.body.message).toBe('Invalid task ID format. Task ID must be numeric.');
      expect(response.body.providedId).toBe('abc');
    });

    test('should return 400 for mixed alphanumeric task ID', async () => {
      const response = await request(app)
        .delete('/delete-task/123abc')
        .expect(400);

      expect(response.body.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for decimal task ID', async () => {
      const response = await request(app)
        .delete('/delete-task/12.5')
        .expect(400);

      expect(response.body.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for task ID with special characters', async () => {
      const response = await request(app)
        .delete('/delete-task/123-456')
        .expect(400);

      expect(response.body.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for negative task ID', async () => {
      const response = await request(app)
        .delete('/delete-task/-123')
        .expect(400);

      expect(response.body.error).toBe('INVALID_TASK_ID_FORMAT');
    });
  });

  describe('Not Found Cases (404)', () => {
    test('should return 404 for non-existent task ID', async () => {
      const response = await request(app)
        .delete('/delete-task/9999999999999')
        .expect(404);

      expect(response.body.error).toBe('TASK_NOT_FOUND');
      expect(response.body.message).toContain('Task with ID 9999999999999 not found');
      expect(response.body.taskId).toBe('9999999999999');
      expect(response.body.availableTaskCount).toBe(2);
    });

    test('should return 404 when tasks file does not exist', async () => {
      // Remove the tasks file
      await fs.unlink(TASKS_FILE);

      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(404);

      expect(response.body.error).toBe('DATABASE_NOT_FOUND');
      expect(response.body.message).toBe('Tasks database file not found.');
    });
  });

  describe('Server Error Cases (500)', () => {
    test('should return 500 for invalid JSON in tasks file', async () => {
      // Write invalid JSON to tasks file
      await fs.writeFile(TASKS_FILE, '{ invalid json }', 'utf8');

      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(500);

      expect(response.body.error).toBe('INVALID_JSON');
      expect(response.body.message).toBe('Database file is corrupted. Unable to parse tasks data.');
    });

    test('should return 500 for non-array JSON structure', async () => {
      // Write a JSON object instead of array
      await fs.writeFile(TASKS_FILE, JSON.stringify({ task: 'not array' }), 'utf8');

      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(500);

      expect(response.body.error).toBe('INVALID_DATABASE_STRUCTURE');
      expect(response.body.message).toBe('Invalid database structure. Expected an array of tasks.');
    });
  });

  describe('Edge Cases', () => {
    test('should handle deleting the last task in the list', async () => {
      // Delete first task
      await request(app)
        .delete('/delete-task/1234567890123')
        .expect(200);

      // Delete second task
      const response = await request(app)
        .delete('/delete-task/9876543210987')
        .expect(200);

      expect(response.body.remainingTasksCount).toBe(0);
    });

    test('should handle deleting from empty array with 404', async () => {
      // Write empty array
      await fs.writeFile(TASKS_FILE, '[]', 'utf8');

      const response = await request(app)
        .delete('/delete-task/1234567890123')
        .expect(404);

      expect(response.body.error).toBe('TASK_NOT_FOUND');
      expect(response.body.availableTaskCount).toBe(0);
    });

    test('should handle task ID with leading zeros', async () => {
      const tasksWithLeadingZeros = [
        { id: '0001234', title: 'Leading Zeros Task' }
      ];
      await fs.writeFile(TASKS_FILE, JSON.stringify(tasksWithLeadingZeros), 'utf8');

      const response = await request(app)
        .delete('/delete-task/0001234')
        .expect(200);

      expect(response.body.deletedTask.id).toBe('0001234');
    });
  });
});
