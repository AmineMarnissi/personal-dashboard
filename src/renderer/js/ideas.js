import { addActivity } from './activity.js';
import { renderDashboard } from './dashboard.js';
// Ideas Functions
export async function renderIdeas() {
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
export function openIdeaModal(editing = false) {
    document.getElementById('idea-modal-title').textContent = editing ? 'Edit Idea' : 'Add Idea';
    document.getElementById('idea-modal').style.display = 'block';
}

export function closeIdeaModal() {
    document.getElementById('idea-modal').style.display = 'none';
    document.getElementById('idea-form').reset();
    document.getElementById('idea-id').value = '';
}

export async function addIdea(idea) {
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

export async function editIdea(id) {
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

export async function updateIdea(updatedIdea) {
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

export async function deleteIdea(id) {
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
