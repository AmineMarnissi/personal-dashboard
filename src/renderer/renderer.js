import { renderDashboard, populateSampleData } from './js/dashboard.js';
import { renderExpenses, openExpenseModal, closeExpenseModal, addExpense, editExpense, updateExpense, deleteExpense } from './js/expenses.js';
import { renderIdeas, openIdeaModal, closeIdeaModal, addIdea, editIdea, updateIdea, deleteIdea } from './js/ideas.js';
import { renderProjects, openProjectModal, closeProjectModal, addProject, editProject, updateProject, deleteProject } from './js/projects.js';
import { renderTraining, openTrainingModal, closeTrainingModal, addTraining, editTraining, updateTraining, deleteTraining } from './js/training.js';
import { renderContacts, openContactModal, closeContactModal, addContact, editContact, updateContact, deleteContact } from './js/contacts.js';
import { updateCurrentDate,setupCalendar } from './js/calender.js';
import { setupTodoList } from './js/todo.js';
import { initializeProfile, profileData } from './js/profile.js';
import { initializeSettings,setupSettingsHandlers } from './js/settings.js';
import { initCryptoTracker } from './js/crypto.js';



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

// Profile functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize profile and settings
    initializeProfile();
    initializeSettings();

    // Profile dropdown functionality
    const toggle = document.getElementById('profile-dropdown-toggle');
    const dropdown = document.getElementById('profile-dropdown');
    const profileLink = document.getElementById('profile-link');
    const settingsLink = document.getElementById('settings-link');

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function () {
        dropdown.style.display = 'none';
    });

    // Profile link click handler
    profileLink.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.style.display = 'none';
        switchToTab('profile');
    });

    // Settings link click handler
    settingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.style.display = 'none';
        switchToTab('settings');
    });

    // Tab switching functionality
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });

    function switchToTab(tabName) {
        // Remove active class from all nav links and tab contents
        navLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected nav link and tab content
        const selectedNavLink = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedTabContent = document.getElementById(tabName);
        
        if (selectedNavLink && selectedTabContent) {
            selectedNavLink.classList.add('active');
            selectedTabContent.classList.add('active');
        }
    }

    // Profile edit functionality
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileModal = document.getElementById('profile-edit-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const cancelProfileEdit = document.getElementById('cancel-profile-edit');
    const profileForm = document.getElementById('profile-form');

    editProfileBtn.addEventListener('click', function() {
        // Populate form with current profile data
        document.getElementById('edit-profile-name').value = profileData.name;
        document.getElementById('edit-profile-email').value = profileData.email;
        document.getElementById('edit-profile-phone').value = profileData.phone;
        document.getElementById('edit-profile-job').value = profileData.job;
        document.getElementById('edit-profile-department').value = profileData.department;
        document.getElementById('edit-profile-location').value = profileData.location;
        document.getElementById('edit-profile-bio').value = profileData.bio;
        
        profileModal.style.display = 'block';
    });

    closeProfileModal.addEventListener('click', function() {
        profileModal.style.display = 'none';
    });

    cancelProfileEdit.addEventListener('click', function() {
        profileModal.style.display = 'none';
    });

    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Update profile data
        profileData.name = document.getElementById('edit-profile-name').value;
        profileData.email = document.getElementById('edit-profile-email').value;
        profileData.phone = document.getElementById('edit-profile-phone').value;
        profileData.job = document.getElementById('edit-profile-job').value;
        profileData.department = document.getElementById('edit-profile-department').value;
        profileData.location = document.getElementById('edit-profile-location').value;
        profileData.bio = document.getElementById('edit-profile-bio').value;
        
        // Update profile display
        initializeProfile();
        
        // Close modal
        profileModal.style.display = 'none';
        
        // Show success message (you can customize this)
        alert('Profile updated successfully!');
    });

    // Avatar change functionality
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarInput = document.getElementById('avatar-input');

    changeAvatarBtn.addEventListener('click', function() {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileData.avatar = e.target.result;
                document.getElementById('profile-avatar').src = profileData.avatar;
                document.querySelector('.topbar .avatar').src = profileData.avatar;
            };
            reader.readAsDataURL(file);
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });

    // Settings functionality
    setupSettingsHandlers();
});
 

// Initialize application
function init() {
    setupEventListeners();
    setupSearchListeners();
    renderDashboard();
    updateCurrentDate();
    setupCalendar();
    setupTodoList();
    populateSampleData();
    setupSettingsHandlers();
    initCryptoTracker();


}
// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);