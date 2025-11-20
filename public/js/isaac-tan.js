// Modal wiring
const modal = document.getElementById('updateTaskModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const updateTaskForm = document.getElementById('updateTaskForm');
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
});

function closeModal() {
    modal.classList.remove('show');
    updateTaskForm.reset();
}

updateTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendUpdate(modal.dataset.taskId);
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
                modal.classList.add('show')
                modal.dataset.taskId = id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDueDate').value = task.dueDate;
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

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

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
            closeModal();
            // Used to reload tasks after updating
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

