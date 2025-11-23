function viewTasks() {
    var response = '';
    var request = new XMLHttpRequest();
    request.open('GET', '/view-tasks', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        try {
            response = JSON.parse(request.responseText || "[]");
        } catch (e) {
            console.error("Failed to parse tasks JSON:", e);
            response = [];
        }

        var html = '';
        // Loop through each task 
        for (var i = 0; i < response.length; i++) {
            var task = response[i];
            var imageHtml = task.imageUrl ? `<img src="${task.imageUrl}" alt="${task.title}" class="task-image">` : '';
            html += `
    <div class="task-card">
      <div class="task-header">
        <p class="task-title">${task.title}</p>
        <div class="task-actions">
          <button class="btn-edit" data-id="${task.id}" onclick="openEditDialog('${task.id}')">✏️</button>
          <button class="btn-delete" data-id="${task.id}">🗑️</button>
        </div>
      </div>

      <p class="task-desc">${task.description}</p>
      ${imageHtml}

      <div class="task-meta">
        <div class="task-status badge ${task.status.replace(/\s+/g, '-').toLowerCase()}">
          ${task.status}
        </div>
        <div class="task-priority badge ${task.priority.toLowerCase()}">
          ${task.priority}
        </div>
        <div class="task-date">
          <i class="calendar-icon">📅</i>
          <span class="date-text">${formatDate(task.dueDate)}</span>
        </div>
      </div>
    </div>
  `;
        }

        var tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.innerHTML = html;
        }
        
        
    };

    request.onerror = function() {
        console.error("Error fetching tasks.");
        var tableContent = document.getElementById('tableContent');
        if (tableContent) {
            tableContent.innerHTML = '<tr><td colspan="7">Failed to load tasks. Please check the server connection.</td></tr>';
        }
    };

    request.send();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
