/**
 * Backend Unit Tests for Delete Task Utility
 * Tests all logical branches in utils/AaronSim.js without starting the server
 */

const { deleteTask } = require('../../utils/AaronSim');
const fs = require('fs').promises;

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

// Helper to create mock request object
const createMockReq = (id) => ({
  params: { id }
});

// Helper to create mock response object
const createMockRes = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    status: jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation((data) => {
      res.jsonData = data;
      return res;
    })
  };
  return res;
};

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

describe('deleteTask Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Path', () => {
    test('should successfully delete an existing task with valid ID', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      fs.writeFile.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.message).toBe('Task deleted successfully.');
      expect(res.jsonData.deletedTask.id).toBe('1234567890123');
      expect(res.jsonData.deletedTask.title).toBe('Test Task 1');
      expect(res.jsonData.remainingTasksCount).toBe(1);
    });

    test('should correctly update the tasks file after deletion', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      fs.writeFile.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenData).toHaveLength(1);
      expect(writtenData[0].id).toBe('9876543210987');
    });

    test('should delete the last task from the list', async () => {
      const req = createMockReq('9876543210987');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      fs.writeFile.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.deletedTask.id).toBe('9876543210987');
      expect(res.jsonData.remainingTasksCount).toBe(1);
    });
  });

  describe('Input Validation - Missing Task ID (400)', () => {
    test('should return 400 when task ID is undefined', async () => {
      const req = createMockReq(undefined);
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('MISSING_TASK_ID');
      expect(res.jsonData.message).toBe('Task ID is required for deletion.');
    });

    test('should return 400 when task ID is null', async () => {
      const req = createMockReq(null);
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('MISSING_TASK_ID');
    });

    test('should return 400 when task ID is empty string', async () => {
      const req = createMockReq('');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('MISSING_TASK_ID');
    });
  });

  describe('Input Validation - Invalid Task ID Format (400)', () => {
    test('should return 400 for non-numeric ID (alphabetic)', async () => {
      const req = createMockReq('abc');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
      expect(res.jsonData.message).toBe('Invalid task ID format. Task ID must be numeric.');
      expect(res.jsonData.providedId).toBe('abc');
    });

    test('should return 400 for mixed alphanumeric ID', async () => {
      const req = createMockReq('123abc');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
      expect(res.jsonData.providedId).toBe('123abc');
    });

    test('should return 400 for decimal number ID', async () => {
      const req = createMockReq('12.5');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for ID with special characters', async () => {
      const req = createMockReq('123-456');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for ID with spaces', async () => {
      const req = createMockReq('123 456');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
    });

    test('should return 400 for negative number ID', async () => {
      const req = createMockReq('-123');
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('INVALID_TASK_ID_FORMAT');
    });
  });

  describe('File Read Errors', () => {
    test('should return 404 when tasks file does not exist (ENOENT)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('DATABASE_NOT_FOUND');
      expect(res.jsonData.message).toBe('Tasks database file not found.');
    });

    test('should return 500 when file read permission denied (EACCES)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.readFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('FILE_ACCESS_DENIED');
      expect(res.jsonData.message).toBe('Permission denied accessing tasks database.');
    });

    test('should return 500 for other file read errors', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      const error = new Error('Unknown read error');
      error.code = 'UNKNOWN';
      fs.readFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('FILE_READ_ERROR');
      expect(res.jsonData.message).toBe('Error accessing tasks database.');
      expect(res.jsonData.details).toBe('Unknown read error');
    });
  });

  describe('JSON Parse Errors (500)', () => {
    test('should return 500 for invalid JSON content', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue('{ invalid json }');

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('INVALID_JSON');
      expect(res.jsonData.message).toBe('Database file is corrupted. Unable to parse tasks data.');
      expect(res.jsonData.details).toBeDefined();
    });

    test('should return 500 for non-array JSON structure (object)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify({ task: 'not an array' }));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('INVALID_DATABASE_STRUCTURE');
      expect(res.jsonData.message).toBe('Invalid database structure. Expected an array of tasks.');
    });

    test('should return 500 for non-array JSON structure (string)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify('just a string'));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('INVALID_DATABASE_STRUCTURE');
    });

    test('should return 500 for non-array JSON structure (number)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(12345));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('INVALID_DATABASE_STRUCTURE');
    });

    test('should return 500 for non-array JSON structure (null)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(null));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('INVALID_DATABASE_STRUCTURE');
    });
  });

  describe('Task Not Found (404)', () => {
    test('should return 404 when task ID does not exist', async () => {
      const req = createMockReq('9999999999999');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('TASK_NOT_FOUND');
      expect(res.jsonData.message).toBe('Task with ID 9999999999999 not found.');
      expect(res.jsonData.taskId).toBe('9999999999999');
      expect(res.jsonData.availableTaskCount).toBe(2);
    });

    test('should return 404 with correct available task count for empty array', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify([]));

      await deleteTask(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('TASK_NOT_FOUND');
      expect(res.jsonData.availableTaskCount).toBe(0);
    });
  });

  describe('File Write Errors (500)', () => {
    test('should return 500 when file write permission denied (EACCES)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.writeFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('FILE_WRITE_PERMISSION_DENIED');
      expect(res.jsonData.message).toBe('Permission denied writing to tasks database.');
    });

    test('should return 500 when disk space is insufficient (ENOSPC)', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      const error = new Error('No space left on device');
      error.code = 'ENOSPC';
      fs.writeFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('DISK_SPACE_ERROR');
      expect(res.jsonData.message).toBe('Insufficient disk space to save changes.');
    });

    test('should return 500 for other file write errors', async () => {
      const req = createMockReq('1234567890123');
      const res = createMockRes();

      fs.readFile.mockResolvedValue(JSON.stringify(sampleTasks));
      const error = new Error('Unknown write error');
      error.code = 'UNKNOWN';
      fs.writeFile.mockRejectedValue(error);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('FILE_WRITE_ERROR');
      expect(res.jsonData.message).toBe('Error saving changes to database after deletion.');
      expect(res.jsonData.details).toBe('Unknown write error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle task ID that is a valid numeric string', async () => {
      const req = createMockReq('0');
      const res = createMockRes();

      const tasksWithZeroId = [{ id: '0', title: 'Zero ID Task' }];
      fs.readFile.mockResolvedValue(JSON.stringify(tasksWithZeroId));
      fs.writeFile.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.deletedTask.id).toBe('0');
    });

    test('should handle large numeric ID', async () => {
      const largeId = '99999999999999999';
      const req = createMockReq(largeId);
      const res = createMockRes();

      const tasksWithLargeId = [{ id: largeId, title: 'Large ID Task' }];
      fs.readFile.mockResolvedValue(JSON.stringify(tasksWithLargeId));
      fs.writeFile.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.deletedTask.id).toBe(largeId);
    });
  });
});
