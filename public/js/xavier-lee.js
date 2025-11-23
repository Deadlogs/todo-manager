// Modal wiring
const modal = document.getElementById('createTaskModal');
const createTaskBtn = document.getElementById('createTaskBtn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const createTaskForm = document.getElementById('createTaskForm');

createTaskBtn.addEventListener('click', () => modal.classList.add('show'));
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
    createTaskForm.reset();
}

// Submit handler
createTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createTask();
});

function createTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDateRaw = document.getElementById('taskDueDate').value;
    const imageFile = document.getElementById('taskImage').files[0];

    if (!title || !dueDateRaw) {
        alert('Title and Due Date are required!');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('status', status);
    formData.append('priority', priority);
    formData.append('dueDate', dueDateRaw);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const request = new XMLHttpRequest();
    request.open('POST', '/create-task', true);

    request.onload = function () {
        let data = null;
        try { data = JSON.parse(request.responseText || 'null'); } catch (_) { }

        if (request.status >= 200 && request.status < 300 && (!data || data.message === undefined)) {
            alert('Added Task: ' + title + '!');
            closeModal();
            viewTasks();
        } else {
            alert('Unable to add task!');
        }
    };

    request.onerror = function () {
        alert('Network error. Please try again.');
    };

    request.send(formData);
}

