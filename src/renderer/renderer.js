// Global variables for charts
let expensesChart, projectsChart, monthlyExpensesChart, trainingChart;

// Helper functions
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const tabId = this.getAttribute('data-tab');
        
        // Update active tab
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show the selected tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        
        // Load data for the selected tab
        switch(tabId) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'expenses':
                renderExpenses();
                break;
            case 'ideas':
                renderIdeas();
                break;
            case 'projects':
                renderProjects();
                break;
            case 'training':
                renderTraining();
                break;
            case 'contacts':
                renderContacts();
                break;
        }
    });
});

// Dashboard Functions
async function renderDashboard() {
    document.getElementById('current-date').textContent = window.electronAPI.formatDate(new Date());
    await renderExpensesChart();
    await renderProjectsChart();
    await renderActivityLog();
}

async function renderExpensesChart() {
    try {
        const categoryData = await window.electronAPI.dbGetExpenseCategories();
        
        const ctx = document.getElementById('expenses-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (expensesChart) {
            expensesChart.destroy();
        }
        
        expensesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryData.map(item => item.category),
                datasets: [{
                    data: categoryData.map(item => item.total),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = window.electronAPI.formatCurrency(context.raw);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering expenses chart:', error);
    }
}

async function renderProjectsChart() {
    try {
        const statusData = await window.electronAPI.dbGetProjectStatusCounts();
        const statusCounts = {
            todo: 0,
            progress: 0,
            done: 0
        };
        
        statusData.forEach(item => {
            statusCounts[item.status] = item.count;
        });
        
        const ctx = document.getElementById('projects-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (projectsChart) {
            projectsChart.destroy();
        }
        
        projectsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    data: [statusCounts.todo, statusCounts.progress, statusCounts.done],
                    backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering projects chart:', error);
    }
}

async function renderActivityLog() {
    try {
        const activities = await window.electronAPI.dbGetRecentActivities(10);
        const activityLog = document.getElementById('activity-log');
        activityLog.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.electronAPI.formatDate(activity.date)}</td>
                <td>${activity.category}</td>
                <td>${activity.description}</td>
            `;
            activityLog.appendChild(row);
        });
    } catch (error) {
        console.error('Error rendering activity log:', error);
    }
}

// Expenses Functions
async function renderExpenses() {
    try {
        const expenses = await window.electronAPI.dbGetAll('expenses');
        const expenseTable = document.getElementById('expense-table');
        expenseTable.innerHTML = '';
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.electronAPI.formatDate(expense.date)}</td>
                <td><span class="badge category-${expense.category.toLowerCase()}">${expense.category}</span></td>
                <td>${expense.description}</td>
                <td>${window.electronAPI.formatCurrency(expense.amount)}</td>
                <td>
                    <button class="action-btn edit-expense" data-id="${expense.id}">Edit</button>
                    <button class="action-btn delete-btn delete-expense" data-id="${expense.id}">Delete</button>
                </td>
            `;
            expenseTable.appendChild(row);
        });
        
        await renderMonthlyExpensesChart();
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-expense').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editExpense(id);
            });
        });
        
        document.querySelectorAll('.delete-expense').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteExpense(id);
            });
        });
    } catch (error) {
        console.error('Error rendering expenses:', error);
    }
}

async function renderMonthlyExpensesChart() {
    try {
        const monthlyData = await window.electronAPI.dbGetMonthlyExpenses();
        
        const monthLabels = monthlyData.map(item => {
            const [year, month] = item.month.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        const ctx = document.getElementById('monthly-expenses-chart').getContext('2d');
        
        if (monthlyExpensesChart) {
            monthlyExpensesChart.destroy();
        }
        
        monthlyExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Monthly Expenses',
                    data: monthlyData.map(item => item.total),
                    backgroundColor: '#3a7bd5'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return window.electronAPI.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return window.electronAPI.formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering monthly expenses chart:', error);
    }
}

function openExpenseModal(editing = false) {
    document.getElementById('expense-modal-title').textContent = editing ? 'Edit Expense' : 'Add Expense';
    document.getElementById('expense-modal').style.display = 'block';
}

function closeExpenseModal() {
    document.getElementById('expense-modal').style.display = 'none';
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
}

async function addExpense(expense) {
    try {
        await window.electronAPI.dbInsert('expenses', expense);
        
        // Add to activity log
        await addActivity('Expense', `Added expense: ${expense.description} (${window.electronAPI.formatCurrency(expense.amount)})`);
        
        await renderExpenses();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense. Please try again.');
    }
}

async function editExpense(id) {
    try {
        const expense = await window.electronAPI.dbGetById('expenses', id);
        
        if (expense) {
            document.getElementById('expense-id').value = expense.id;
            document.getElementById('expense-date').value = expense.date;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-description').value = expense.description;
            document.getElementById('expense-amount').value = expense.amount;
            
            openExpenseModal(true);
        }
    } catch (error) {
        console.error('Error loading expense for edit:', error);
    }
}

async function updateExpense(updatedExpense) {
    try {
        await window.electronAPI.dbUpdate('expenses', updatedExpense.id, {
            date: updatedExpense.date,
            category: updatedExpense.category,
            description: updatedExpense.description,
            amount: updatedExpense.amount
        });
        
        // Add to activity log
        await addActivity('Expense', `Updated expense: ${updatedExpense.description} (${window.electronAPI.formatCurrency(updatedExpense.amount)})`);
        
        await renderExpenses();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Error updating expense. Please try again.');
    }
}

async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await window.electronAPI.dbDelete('expenses', id);
            
            // Add to activity log
            await addActivity('Expense', 'Deleted an expense');
            
            await renderExpenses();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error deleting expense. Please try again.');
        }
    }
}

// Ideas Functions
async function renderIdeas() {
    try {
        const ideas = await window.electronAPI.dbGetAll('ideas');
        const ideasContainer = document.getElementById('ideas-container');
        ideasContainer.innerHTML = '';
        
        ideas.forEach(idea => {
            const ideaCard = document.createElement('div');
            ideaCard.className = 'idea-card';
            
            // Parse tags from database (stored as comma-separated string)
            const tags = idea.tags ? idea.tags.split(',') : [];
            const tagElements = tags.map(tag => `<span class="idea-tag">${tag.trim()}</span>`).join('');
            
            ideaCard.innerHTML = `
                <div class="idea-card-header">
                    <h3 class="idea-title">${idea.title}</h3>
                    <span class="idea-date">${window.electronAPI.formatDate(idea.date)}</span>
                </div>
                <div class="idea-content">${idea.description}</div>
                <div class="idea-tags">${tagElements}</div>
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="action-btn edit-idea" data-id="${idea.id}">Edit</button>
                    <button class="action-btn delete-btn delete-idea" data-id="${idea.id}">Delete</button>
                </div>
            `;
            
            ideasContainer.appendChild(ideaCard);
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-idea').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editIdea(id);
            });
        });
        
        document.querySelectorAll('.delete-idea').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteIdea(id);
            });
        });
    } catch (error) {
        console.error('Error rendering ideas:', error);
    }
}

function openIdeaModal(editing = false) {
    document.getElementById('idea-modal-title').textContent = editing ? 'Edit Idea' : 'Add Idea';
    document.getElementById('idea-modal').style.display = 'block';
}

function closeIdeaModal() {
    document.getElementById('idea-modal').style.display = 'none';
    document.getElementById('idea-form').reset();
    document.getElementById('idea-id').value = '';
}

async function addIdea(idea) {
    try {
        await window.electronAPI.dbInsert('ideas', idea);
        
        // Add to activity log
        await addActivity('Idea', `Added idea: ${idea.title}`);
        
        await renderIdeas();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding idea:', error);
        alert('Error adding idea. Please try again.');
    }
}

async function editIdea(id) {
    try {
        const idea = await window.electronAPI.dbGetById('ideas', id);
        
        if (idea) {
            document.getElementById('idea-id').value = idea.id;
            document.getElementById('idea-title').value = idea.title;
            document.getElementById('idea-description').value = idea.description;
            document.getElementById('idea-tags').value = idea.tags || '';
            
            openIdeaModal(true);
        }
    } catch (error) {
        console.error('Error loading idea for edit:', error);
    }
}

async function updateIdea(updatedIdea) {
    try {
        await window.electronAPI.dbUpdate('ideas', updatedIdea.id, {
            title: updatedIdea.title,
            description: updatedIdea.description,
            tags: updatedIdea.tags,
            date: updatedIdea.date
        });
        
        // Add to activity log
        await addActivity('Idea', `Updated idea: ${updatedIdea.title}`);
        
        await renderIdeas();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating idea:', error);
        alert('Error updating idea. Please try again.');
    }
}

async function deleteIdea(id) {
    if (confirm('Are you sure you want to delete this idea?')) {
        try {
            await window.electronAPI.dbDelete('ideas', id);
            
            // Add to activity log
            await addActivity('Idea', 'Deleted an idea');
            
            await renderIdeas();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting idea:', error);
            alert('Error deleting idea. Please try again.');
        }
    }
}

// Projects Functions
async function renderProjects() {
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

function openProjectModal(editing = false) {
    document.getElementById('project-modal-title').textContent = editing ? 'Edit Project' : 'Add Project';
    document.getElementById('project-modal').style.display = 'block';
}

function closeProjectModal() {
    document.getElementById('project-modal').style.display = 'none';
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
}

async function addProject(project) {
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

async function editProject(id) {
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

async function updateProject(updatedProject) {
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

async function deleteProject(id) {
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

// Training Functions
async function renderTraining() {
    try {
        const trainingSessions = await window.electronAPI.dbGetAll('training');
        const trainingTable = document.getElementById('training-table');
        trainingTable.innerHTML = '';
        
        trainingSessions.forEach(session => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.electronAPI.formatDate(session.date)}</td>
                <td>${session.activity}</td>
                <td>${session.duration} minutes</td>
                <td>${session.notes || ''}</td>
                <td>
                    <button class="action-btn edit-training" data-id="${session.id}">Edit</button>
                    <button class="action-btn delete-btn delete-training" data-id="${session.id}">Delete</button>
                </td>
            `;
            trainingTable.appendChild(row);
        });
        
        await renderTrainingChart();
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-training').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editTraining(id);
            });
        });
        
        document.querySelectorAll('.delete-training').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTraining(id);
            });
        });
    } catch (error) {
        console.error('Error rendering training:', error);
    }
}

async function renderTrainingChart() {
    try {
        const weeklyData = await window.electronAPI.dbGetTrainingWeekly();
        
        const ctx = document.getElementById('training-chart').getContext('2d');
        
        if (trainingChart) {
            trainingChart.destroy();
        }
        
        trainingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.map(item => {
                    if (item.week) {
                        const [year, week] = item.week.split('-W');
                        return `Week ${week}, ${year}`;
                    }
                    return 'Unknown';
                }),
                datasets: [{
                    label: 'Training Minutes',
                    data: weeklyData.map(item => item.total_duration || 0),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering training chart:', error);
    }
}

function openTrainingModal(editing = false) {
    document.getElementById('training-modal-title').textContent = editing ? 'Edit Training' : 'Add Training';
    document.getElementById('training-modal').style.display = 'block';
}

function closeTrainingModal() {
    document.getElementById('training-modal').style.display = 'none';
    document.getElementById('training-form').reset();
    document.getElementById('training-id').value = '';
}

async function addTraining(training) {
    try {
        await window.electronAPI.dbInsert('training', training);
        
        // Add to activity log
        await addActivity('Training', `Completed ${training.activity} for ${training.duration} minutes`);
        
        await renderTraining();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding training:', error);
        alert('Error adding training. Please try again.');
    }
}

async function editTraining(id) {
    try {
        const training = await window.electronAPI.dbGetById('training', id);
        
        if (training) {
            document.getElementById('training-id').value = training.id;
            document.getElementById('training-date').value = training.date;
            document.getElementById('training-activity').value = training.activity;
            document.getElementById('training-duration').value = training.duration;
            document.getElementById('training-notes').value = training.notes || '';
            
            openTrainingModal(true);
        }
    } catch (error) {
        console.error('Error loading training for edit:', error);
    }
}

async function updateTraining(updatedTraining) {
    try {
        await window.electronAPI.dbUpdate('training', updatedTraining.id, {
            date: updatedTraining.date,
            activity: updatedTraining.activity,
            duration: updatedTraining.duration,
            notes: updatedTraining.notes
        });
        
        // Add to activity log
        await addActivity('Training', `Updated training: ${updatedTraining.activity} for ${updatedTraining.duration} minutes`);
        
        await renderTraining();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating training:', error);
        alert('Error updating training. Please try again.');
    }
}

async function deleteTraining(id) {
    if (confirm('Are you sure you want to delete this training session?')) {
        try {
            await window.electronAPI.dbDelete('training', id);
            
            // Add to activity log
            await addActivity('Training', 'Deleted a training session');
            
            await renderTraining();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting training:', error);
            alert('Error deleting training. Please try again.');
        }
    }
}

// Contacts Functions
async function renderContacts() {
    try {
        const contacts = await window.electronAPI.dbGetAll('contacts');
        const contactsTable = document.getElementById('contacts-table');
        contactsTable.innerHTML = '';
        
        // Sort alphabetically by name
        contacts.sort((a, b) => a.name.localeCompare(b.name));
        
        contacts.forEach(contact => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.email || '-'}</td>
                <td>${contact.phone || '-'}</td>
                <td>${contact.category || '-'}</td>
                <td>
                    <button class="action-btn edit-contact" data-id="${contact.id}">Edit</button>
                    <button class="action-btn delete-btn delete-contact" data-id="${contact.id}">Delete</button>
                </td>
            `;
            contactsTable.appendChild(row);
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-contact').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editContact(id);
            });
        });
        
        document.querySelectorAll('.delete-contact').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteContact(id);
            });
        });
    } catch (error) {
        console.error('Error rendering contacts:', error);
    }
}

function openContactModal(editing = false) {
    document.getElementById('contact-modal-title').textContent = editing ? 'Edit Contact' : 'Add Contact';
    document.getElementById('contact-modal').style.display = 'block';
}

function closeContactModal() {
    document.getElementById('contact-modal').style.display = 'none';
    document.getElementById('contact-form').reset();
    document.getElementById('contact-id').value = '';
}

async function addContact(contact) {
    try {
        await window.electronAPI.dbInsert('contacts', contact);
        
        // Add to activity log
        await addActivity('Contact', `Added contact: ${contact.name}`);
        
        await renderContacts();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding contact:', error);
        alert('Error adding contact. Please try again.');
    }
}

async function editContact(id) {
    try {
        const contact = await window.electronAPI.dbGetById('contacts', id);
        
        if (contact) {
            document.getElementById('contact-id').value = contact.id;
            document.getElementById('contact-name').value = contact.name;
            document.getElementById('contact-email').value = contact.email || '';
            document.getElementById('contact-phone').value = contact.phone || '';
            document.getElementById('contact-category').value = contact.category || '';
            document.getElementById('contact-notes').value = contact.notes || '';
            
            openContactModal(true);
        }
    } catch (error) {
        console.error('Error loading contact for edit:', error);
    }
}

async function updateContact(updatedContact) {
    try {
        await window.electronAPI.dbUpdate('contacts', updatedContact.id, {
            name: updatedContact.name,
            email: updatedContact.email,
            phone: updatedContact.phone,
            category: updatedContact.category,
            notes: updatedContact.notes
        });
        
        // Add to activity log
        await addActivity('Contact', `Updated contact: ${updatedContact.name}`);
        
        await renderContacts();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating contact:', error);
        alert('Error updating contact. Please try again.');
    }
}

async function deleteContact(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
        try {
            await window.electronAPI.dbDelete('contacts', id);
            
            // Add to activity log
            await addActivity('Contact', 'Deleted a contact');
            
            await renderContacts();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert('Error deleting contact. Please try again.');
        }
    }
}

// Helper function for activity log
async function addActivity(category, description) {
    try {
        const activity = {
            date: window.electronAPI.getCurrentDate(),
            category: category,
            description: description
        };
        
        await window.electronAPI.dbInsert('activities', activity);
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Search functionality
function setupSearchListeners() {
    // Ideas search
    const ideaSearch = document.getElementById('idea-search');
    ideaSearch.addEventListener('input', async function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            renderIdeas();
            return;
        }
        
        try {
            const filteredIdeas = await window.electronAPI.dbSearch('ideas', searchTerm, ['title', 'description', 'tags']);
            const ideasContainer = document.getElementById('ideas-container');
            ideasContainer.innerHTML = '';
            
            filteredIdeas.forEach(idea => {
                const ideaCard = document.createElement('div');
                ideaCard.className = 'idea-card';
                
                const tags = idea.tags ? idea.tags.split(',') : [];
                const tagElements = tags.map(tag => `<span class="idea-tag">${tag.trim()}</span>`).join('');
                
                ideaCard.innerHTML = `
                    <div class="idea-card-header">
                        <h3 class="idea-title">${idea.title}</h3>
                        <span class="idea-date">${window.electronAPI.formatDate(idea.date)}</span>
                    </div>
                    <div class="idea-content">${idea.description}</div>
                    <div class="idea-tags">${tagElements}</div>
                    <div style="margin-top: 1rem; text-align: right;">
                        <button class="action-btn edit-idea" data-id="${idea.id}">Edit</button>
                        <button class="action-btn delete-btn delete-idea" data-id="${idea.id}">Delete</button>
                    </div>
                `;
                
                ideasContainer.appendChild(ideaCard);
            });
            
            // Re-add event listeners
            document.querySelectorAll('.edit-idea').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    editIdea(id);
                });
            });
            
            document.querySelectorAll('.delete-idea').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteIdea(id);
                });
            });
        } catch (error) {
            console.error('Error searching ideas:', error);
        }
    });
    
    // Contacts search
    const contactSearch = document.getElementById('contact-search');
    contactSearch.addEventListener('input', async function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            renderContacts();
            return;
        }
        
        try {
            const filteredContacts = await window.electronAPI.dbSearch('contacts', searchTerm, ['name', 'email', 'phone', 'category']);
            const contactsTable = document.getElementById('contacts-table');
            contactsTable.innerHTML = '';
            
            filteredContacts.forEach(contact => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.name}</td>
                    <td>${contact.email || '-'}</td>
                    <td>${contact.phone || '-'}</td>
                    <td>${contact.category || '-'}</td>
                    <td>
                        <button class="action-btn edit-contact" data-id="${contact.id}">Edit</button>
                        <button class="action-btn delete-btn delete-contact" data-id="${contact.id}">Delete</button>
                    </td>
                `;
                contactsTable.appendChild(row);
            });
            
            // Re-add event listeners
            document.querySelectorAll('.edit-contact').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    editContact(id);
                });
            });
            
            document.querySelectorAll('.delete-contact').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteContact(id);
                });
            });
        } catch (error) {
            console.error('Error searching contacts:', error);
        }
    });
}

// Event listeners for all forms and modals
function setupEventListeners() {
    // Expense Modal
    document.getElementById('add-expense-btn').addEventListener('click', function() {
        openExpenseModal();
    });
    
    document.getElementById('close-expense-modal').addEventListener('click', function() {
        closeExpenseModal();
    });
    
    document.getElementById('cancel-expense').addEventListener('click', function() {
        closeExpenseModal();
    });
    
    document.getElementById('expense-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const expenseId = document.getElementById('expense-id').value;
        const expense = {
            date: document.getElementById('expense-date').value,
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-description').value,
            amount: parseFloat(document.getElementById('expense-amount').value)
        };
        
        if (expenseId) {
            expense.id = parseInt(expenseId);
            updateExpense(expense);
        } else {
            addExpense(expense);
        }
        
        closeExpenseModal();
    });
    
    // Idea Modal
    document.getElementById('add-idea-btn').addEventListener('click', function() {
        openIdeaModal();
    });
    
    document.getElementById('close-idea-modal').addEventListener('click', function() {
        closeIdeaModal();
    });
    
    document.getElementById('cancel-idea').addEventListener('click', function() {
        closeIdeaModal();
    });
    
    document.getElementById('idea-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const ideaId = document.getElementById('idea-id').value;
        const idea = {
            title: document.getElementById('idea-title').value,
            description: document.getElementById('idea-description').value,
            tags: document.getElementById('idea-tags').value,
            date: window.electronAPI.getCurrentDate()
        };
        
        if (ideaId) {
            idea.id = parseInt(ideaId);
            updateIdea(idea);
        } else {
            addIdea(idea);
        }
        
        closeIdeaModal();
    });
    
    // Project Modal
    document.getElementById('add-project-btn').addEventListener('click', function() {
        openProjectModal();
    });
    
    document.getElementById('close-project-modal').addEventListener('click', function() {
        closeProjectModal();
    });
    
    document.getElementById('cancel-project').addEventListener('click', function() {
        closeProjectModal();
    });
    
    document.getElementById('project-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const projectId = document.getElementById('project-id').value;
        const project = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            due_date: document.getElementById('project-due-date').value,
            status: document.getElementById('project-status').value,
            priority: document.getElementById('project-priority').value
        };
        
        if (projectId) {
            project.id = parseInt(projectId);
            updateProject({
                id: project.id,
                title: project.title,
                description: project.description,
                dueDate: project.due_date,
                status: project.status,
                priority: project.priority
            });
        } else {
            addProject(project);
        }
        
        closeProjectModal();
    });
    
    // Training Modal
    document.getElementById('add-training-btn').addEventListener('click', function() {
        openTrainingModal();
    });
    
    document.getElementById('close-training-modal').addEventListener('click', function() {
        closeTrainingModal();
    });
    
    document.getElementById('cancel-training').addEventListener('click', function() {
        closeTrainingModal();
    });
    
    document.getElementById('training-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const trainingId = document.getElementById('training-id').value;
        const training = {
            date: document.getElementById('training-date').value,
            activity: document.getElementById('training-activity').value,
            duration: parseInt(document.getElementById('training-duration').value),
            notes: document.getElementById('training-notes').value
        };
        
        if (trainingId) {
            training.id = parseInt(trainingId);
            updateTraining(training);
        } else {
            addTraining(training);
        }
        
        closeTrainingModal();
    });
    
    // Contact Modal
    document.getElementById('add-contact-btn').addEventListener('click', function() {
        openContactModal();
    });
    
    document.getElementById('close-contact-modal').addEventListener('click', function() {
        closeContactModal();
    });
    
    document.getElementById('cancel-contact').addEventListener('click', function() {
        closeContactModal();
    });
    
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const contactId = document.getElementById('contact-id').value;
        const contact = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            category: document.getElementById('contact-category').value,
            notes: document.getElementById('contact-notes').value
        };
        
        if (contactId) {
            contact.id = parseInt(contactId);
            updateContact(contact);
        } else {
            addContact(contact);
        }
        
        closeContactModal();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Initialize application
function init() {
    setupEventListeners();
    setupSearchListeners();
    renderDashboard();
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);