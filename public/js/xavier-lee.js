// Get modal elements
const modal = document.getElementById('createTaskModal');
const createTaskBtn = document.getElementById('createTaskBtn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const createTaskForm = document.getElementById('createTaskForm');

// Open modal when "Create New Task" button is clicked
createTaskBtn.addEventListener('click', function() {
    modal.classList.add('show');
});

// Close modal when X button is clicked
closeModalBtn.addEventListener('click', function() {
    closeModal();
});

// Close modal when Cancel button is clicked
cancelBtn.addEventListener('click', function() {
    closeModal();
});

// Close modal when clicking outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
    }
});

// Function to close modal and reset form
function closeModal() {
    modal.classList.remove('show');
    createTaskForm.reset();
}

// Handle form submission
createTaskForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get form values
    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: formatDate(document.getElementById('taskDueDate').value)
    };
    
    // Send POST request to create task
    const request = new XMLHttpRequest();
    request.open('POST', '/create-task', true);
    request.setRequestHeader('Content-Type', 'application/json');
    
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            console.log('Task created successfully');
            // Close modal
            closeModal();
            // Refresh task list
            viewTasks();
        } else {
            console.error('Error creating task:', request.statusText);
            alert('Failed to create task. Please try again.');
        }
    };
    
    request.onerror = function() {
        console.error('Network error occurred');
        alert('Network error. Please check your connection.');
    };
    
    // Send the request with form data
    request.send(JSON.stringify(formData));
});

// Helper function to format date to "MMM DD, YYYY" format
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
