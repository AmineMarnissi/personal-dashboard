import { addActivity } from './activity.js';
import { renderDashboard } from './dashboard.js';

// Projects Functions
export async function renderProjects() {
    try {
        const projects = await window.electronAPI.dbGetAll('projects');
        
        const todoColumn = document.getElementById('todo-column');
        const progressColumn = document.getElementById('progress-column');
        const doneColumn = document.getElementById('done-column');
        
        todoColumn.innerHTML = '';
        progressColumn.innerHTML = '';
        doneColumn.innerHTML = '';
        
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'kanban-task';
            projectElement.setAttribute('data-id', project.id);
            
            let priorityClass = '';
            switch (project.priority) {
                case 'high': priorityClass = 'badge-danger'; break;
                case 'medium': priorityClass = 'badge-warning'; break;
                case 'low': priorityClass = 'badge-success'; break;
            }
            
            projectElement.innerHTML = `
                <div class="kanban-task-title">${project.title}</div>
                <div class="kanban-task-description">${project.description}</div>
                <div class="kanban-task-meta">
                    <span class="badge ${priorityClass}">${project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}</span>
                    ${project.due_date ? `<span>Due: ${window.electronAPI.formatDate(project.due_date)}</span>` : ''}
                </div>
                <div style="margin-top: 0.5rem; text-align: right;">
                    <button class="action-btn edit-project" data-id="${project.id}">Edit</button>
                    <button class="action-btn delete-btn delete-project" data-id="${project.id}">Delete</button>
                </div>
            `;
            
            switch (project.status) {
                case 'todo':
                    todoColumn.appendChild(projectElement);
                    break;
                case 'progress':
                    progressColumn.appendChild(projectElement);
                    break;
                case 'done':
                    doneColumn.appendChild(projectElement);
                    break;
            }
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-project').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editProject(id);
            });
        });
        
        document.querySelectorAll('.delete-project').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteProject(id);
            });
        });
    } catch (error) {
        console.error('Error rendering projects:', error);
    }
}

export function openProjectModal(editing = false) {
    document.getElementById('project-modal-title').textContent = editing ? 'Edit Project' : 'Add Project';
    document.getElementById('project-modal').style.display = 'block';
}

export function closeProjectModal() {
    document.getElementById('project-modal').style.display = 'none';
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
}

export async function addProject(project) {
    try {
        await window.electronAPI.dbInsert('projects', project);
        
        // Add to activity log
        await addActivity('Project', `Added project: ${project.title}`);
        
        await renderProjects();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding project:', error);
        alert('Error adding project. Please try again.');
    }
}

export async function editProject(id) {
    try {
        const project = await window.electronAPI.dbGetById('projects', id);
        
        if (project) {
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-due-date').value = project.due_date || '';
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-priority').value = project.priority;
            
            openProjectModal(true);
        }
    } catch (error) {
        console.error('Error loading project for edit:', error);
    }
}

export async function updateProject(updatedProject) {
    try {
        await window.electronAPI.dbUpdate('projects', updatedProject.id, {
            title: updatedProject.title,
            description: updatedProject.description,
            due_date: updatedProject.dueDate,
            status: updatedProject.status,
            priority: updatedProject.priority
        });
        
        // Add to activity log
        await addActivity('Project', `Updated project: ${updatedProject.title}`);
        
        await renderProjects();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating project:', error);
        alert('Error updating project. Please try again.');
    }
}

export async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            await window.electronAPI.dbDelete('projects', id);
            
            // Add to activity log
            await addActivity('Project', 'Deleted a project');
            
            await renderProjects();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error deleting project. Please try again.');
        }
    }
}