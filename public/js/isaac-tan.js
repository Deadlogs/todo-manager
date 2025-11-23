// Modal wiring
const updateModal = document.getElementById('updateTaskModal');
const closeUpdateModalBtn = document.getElementById('closeUpdateModal');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
const updateTaskForm = document.getElementById('updateTaskForm');
closeUpdateModalBtn.addEventListener('click', closeUpdateModal);
cancelUpdateBtn.addEventListener('click', closeUpdateModal);

window.addEventListener('click', (e) => {
    if (e.target === updateModal) closeUpdateModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && updateModal.classList.contains('show')) closeUpdateModal();
});

function closeUpdateModal() {
    updateModal.classList.remove('show');
    updateTaskForm.reset();
}

updateTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendUpdate(updateModal.dataset.taskId);
});

function openEditDialog(id) {
    // Fetch existing task data to fill the form
    var request = new XMLHttpRequest();
    request.open('GET', '/view-tasks', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
            let tasks = JSON.parse(request.responseText || "[]");
            const task = tasks.find(t => t.id === id);
            if (task) {
                updateModal.classList.add('show')
                updateModal.dataset.taskId = id;
                document.getElementById('updateTaskTitle').value = task.title;
                document.getElementById('updateTaskDescription').value = task.description;
                document.getElementById('updateTaskStatus').value = task.status;
                document.getElementById('updateTaskPriority').value = task.priority;
                document.getElementById('updateTaskDueDate').value = task.dueDate;
            } else {
                alert(`Could not find task. It was likely deleted.`);
            }
        } else {
            alert(`Failed to load task ${id} for editing. Server returned status: ${request.status}`);
        }
    };
    request.send();
}

function sendUpdate(id) {

    const title = document.getElementById('updateTaskTitle').value.trim();
    const description = document.getElementById('updateTaskDescription').value;
    const status = document.getElementById('updateTaskStatus').value;
    const priority = document.getElementById('updateTaskPriority').value;
    const dueDate = document.getElementById('updateTaskDueDate').value;
    if (!title || !dueDate) {
        alert('Title and Due Date are required!');
        return;
    }

    const updateData = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate
    };

    var request = new XMLHttpRequest();
    request.open('PUT', `/update-task/${id}`, true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
            console.log(`Task ${id} updated successfully.`);
            closeUpdateModal();
            viewTasks();
        } else {
            alert(`Failed to update task ${id}. Server returned status: ${request.status}`);
            console.error(`Failed to update task ${id}. Server returned status: ${request.status}`);
        }
    };

    request.onerror = function () {
        alert("Error connecting to server for task update.");
        console.error("Error connecting to server for task update.");
    };

    request.send(JSON.stringify(updateData));
}

