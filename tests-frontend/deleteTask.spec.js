/**
 * Frontend Tests for Delete Task Feature
 * Tests user interaction and UI response using Playwright
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

const TASKS_FILE = path.join(__dirname, '../utils/tasks.json');

// Sample task data for testing
const sampleTasks = [
  {
    id: '1234567890123',
    title: 'Test Task for Deletion',
    description: 'This task will be deleted',
    status: 'To Do',
    priority: 'High',
    dueDate: '2025-12-31'
  },
  {
    id: '9876543210987',
    title: 'Another Test Task',
    description: 'This task should remain',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '2025-11-30'
  }
];

// Helper to seed test data
async function seedTestData(tasks = sampleTasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// Helper to read tasks from file
async function readTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

test.describe('Delete Task Frontend', () => {
  test.beforeEach(async ({ page }) => {
    // Seed test data before each test
    await seedTestData();

    // Navigate to the app
    await page.goto('/');

    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 10000 });
  });

  test.describe('Delete Button Interaction', () => {
    test('should display delete button on each task card', async ({ page }) => {
      const deleteButtons = await page.locator('.btn-delete').all();
      expect(deleteButtons.length).toBe(2);
    });

    test('should have correct data-id attribute on delete button', async ({ page }) => {
      const deleteButton = page.locator('.btn-delete').first();
      const dataId = await deleteButton.getAttribute('data-id');
      expect(dataId).toBe('1234567890123');
    });

    test('should show confirmation dialog when clicking delete button', async ({ page }) => {
      // Set up dialog handler to capture the message
      let dialogMessage = '';
      page.on('dialog', async dialog => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
      });

      // Click the delete button
      await page.locator('.btn-delete').first().click();

      // Wait a bit for the dialog to appear
      await page.waitForTimeout(500);

      // Verify dialog was shown with task title
      expect(dialogMessage).toContain('Test Task for Deletion');
      expect(dialogMessage).toContain('Are you sure you want to delete');
    });

    test('should not delete task when confirmation is cancelled', async ({ page }) => {
      // Dismiss the confirmation dialog
      page.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') {
          await dialog.dismiss();
        }
      });

      // Click the delete button
      await page.locator('.btn-delete').first().click();

      // Wait for any potential action
      await page.waitForTimeout(1000);

      // Verify task is still in the list
      const taskCards = await page.locator('.task-card').all();
      expect(taskCards.length).toBe(2);

      // Verify task is still in the file
      const tasks = await readTasks();
      expect(tasks.length).toBe(2);
    });
  });

  test.describe('Successful Deletion', () => {
    test('should delete task when confirmation is accepted', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Click the delete button for the first task
      await page.locator('.btn-delete').first().click();

      // Wait for the deletion to complete and UI to refresh
      await page.waitForTimeout(2000);

      // Verify only one task remains in the UI
      const taskCards = await page.locator('.task-card').all();
      expect(taskCards.length).toBe(1);
    });

    test('should show success message after deletion', async ({ page }) => {
      let alertMessage = '';

      // Capture alert messages
      page.on('dialog', async dialog => {
        if (dialog.type() === 'alert') {
          alertMessage = dialog.message();
        }
        await dialog.accept();
      });

      // Click the delete button
      await page.locator('.btn-delete').first().click();

      // Wait for the operation to complete
      await page.waitForTimeout(2000);

      // Verify success message
      expect(alertMessage).toContain('deleted successfully');
    });

    test('should remove deleted task from UI', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Get initial task title
      const initialTitle = await page.locator('.task-title').first().textContent();
      expect(initialTitle).toBe('Test Task for Deletion');

      // Click delete
      await page.locator('.btn-delete').first().click();

      // Wait for UI update
      await page.waitForTimeout(2000);

      // Verify the deleted task is no longer visible
      const remainingTitle = await page.locator('.task-title').first().textContent();
      expect(remainingTitle).toBe('Another Test Task');
    });

    test('should update task list after successful deletion', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Click delete
      await page.locator('.btn-delete').first().click();

      // Wait for UI update
      await page.waitForTimeout(2000);

      // Verify file is updated
      const tasks = await readTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('9876543210987');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle task not found error gracefully', async ({ page }) => {
      let alertMessage = '';

      // Capture alert messages
      page.on('dialog', async dialog => {
        if (dialog.type() === 'alert') {
          alertMessage = dialog.message();
        }
        await dialog.accept();
      });

      // Delete the task from file directly to simulate race condition
      const tasksWithoutFirst = sampleTasks.filter(t => t.id !== '1234567890123');
      await fs.writeFile(TASKS_FILE, JSON.stringify(tasksWithoutFirst), 'utf8');

      // Try to delete the task that no longer exists
      await page.locator('.btn-delete').first().click();

      // Wait for operation
      await page.waitForTimeout(2000);

      // Verify error message is shown
      expect(alertMessage).toContain('not found');
    });

    test('should refresh task list after 404 error', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Delete the task from file directly
      const tasksWithoutFirst = sampleTasks.filter(t => t.id !== '1234567890123');
      await fs.writeFile(TASKS_FILE, JSON.stringify(tasksWithoutFirst), 'utf8');

      // Try to delete
      await page.locator('.btn-delete').first().click();

      // Wait for refresh
      await page.waitForTimeout(2000);

      // Verify UI shows the refreshed list (only 1 task)
      const taskCards = await page.locator('.task-card').all();
      expect(taskCards.length).toBe(1);
    });

    test('should handle server error gracefully', async ({ page }) => {
      let alertMessage = '';

      page.on('dialog', async dialog => {
        if (dialog.type() === 'alert') {
          alertMessage = dialog.message();
        }
        await dialog.accept();
      });

      // Write invalid JSON to cause server error
      await fs.writeFile(TASKS_FILE, '{ invalid json }', 'utf8');

      // Reload the page (will fail to load tasks initially)
      await page.reload();
      await page.waitForTimeout(1000);

      // Restore valid data for the button to appear
      await seedTestData();
      await page.reload();
      await page.waitForSelector('.task-card', { timeout: 5000 });

      // Now corrupt the file again
      await fs.writeFile(TASKS_FILE, '{ invalid json }', 'utf8');

      // Try to delete
      await page.locator('.btn-delete').first().click();

      // Wait for operation
      await page.waitForTimeout(2000);

      // Verify error message (either from GET or DELETE)
      expect(alertMessage.length).toBeGreaterThan(0);
    });
  });

  test.describe('Delete All Tasks', () => {
    test('should handle deleting all tasks', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Delete first task
      await page.locator('.btn-delete').first().click();
      await page.waitForTimeout(2000);

      // Delete second task
      const remainingDeleteBtn = page.locator('.btn-delete');
      if (await remainingDeleteBtn.count() > 0) {
        await remainingDeleteBtn.first().click();
        await page.waitForTimeout(2000);
      }

      // Verify no task cards remain
      const taskCards = await page.locator('.task-card').all();
      expect(taskCards.length).toBe(0);

      // Verify file is empty array
      const tasks = await readTasks();
      expect(tasks.length).toBe(0);
    });
  });

  test.describe('UI State After Deletion', () => {
    test('should maintain page state after deletion', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Verify header is present
      await expect(page.locator('.app-title')).toHaveText('Task Manager');

      // Delete a task
      await page.locator('.btn-delete').first().click();
      await page.waitForTimeout(2000);

      // Verify header is still present
      await expect(page.locator('.app-title')).toHaveText('Task Manager');

      // Verify create button is still functional
      await expect(page.locator('#createTaskBtn')).toBeVisible();
    });

    test('should show remaining task details correctly after deletion', async ({ page }) => {
      // Accept all dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Delete first task
      await page.locator('.btn-delete').first().click();
      await page.waitForTimeout(2000);

      // Verify remaining task has correct details
      const remainingTask = page.locator('.task-card').first();
      await expect(remainingTask.locator('.task-title')).toHaveText('Another Test Task');
      await expect(remainingTask.locator('.task-desc')).toHaveText('This task should remain');
    });
  });
});

test.describe('Delete Task Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData();
    await page.goto('/');
    await page.waitForSelector('.task-card', { timeout: 10000 });
  });

  test('should handle delete button with valid numeric ID', async ({ page }) => {
    // Accept all dialogs
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Verify delete button has valid numeric ID
    const deleteButton = page.locator('.btn-delete').first();
    const dataId = await deleteButton.getAttribute('data-id');
    expect(/^\d+$/.test(dataId)).toBe(true);

    // Click and verify deletion works
    await deleteButton.click();
    await page.waitForTimeout(2000);

    const taskCards = await page.locator('.task-card').all();
    expect(taskCards.length).toBe(1);
  });
});
