const fs = require('fs').promises;
const path = require('path');
const TASKS_FILE = path.join('utils', 'tasks.json');

async function updateTask(req, res) {
    const taskId = req.params.id; 
    const updateData = req.body;  

    if (!taskId) {
        return res.status(400).json({ message: 'Task ID is required for update.' });
    }

    // Read tasks
    let allTasks = [];
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        allTasks = JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, treat as an empty list 
        if (error.code !== 'ENOENT') {
            console.error('Error reading tasks file:', error);
            return res.status(500).json({ message: 'Error accessing tasks database.' });
        }
    }

    // Find task to update
    const taskIndex = allTasks.findIndex(task => task.id === taskId);

    // Task not found
    if (taskIndex === -1) {
        return res.status(404).json({ message: `Task with ID ${taskId} not found.` });
    }

    const taskToUpdate = allTasks[taskIndex];
    
    // Use spread operator to update task
    const updatedTask = { 
        ...taskToUpdate,
        ...updateData   
    };
    
    // Replace the old task with the updated one in the array
    allTasks[taskIndex] = updatedTask;

    // Write the updated array into the database
    try {
        await fs.writeFile(TASKS_FILE, JSON.stringify(allTasks, null, 2), 'utf8');
        return res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error writing updated tasks file:', error);
        return res.status(500).json({ message: 'Error saving updated task to database.' });
    }
}

module.exports = { updateTask };