
import { addActivity } from './activity.js';
import { renderDashboard } from './dashboard.js';
// Contacts Functions
export async function renderContacts() {
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

export function openContactModal(editing = false) {
    document.getElementById('contact-modal-title').textContent = editing ? 'Edit Contact' : 'Add Contact';
    document.getElementById('contact-modal').style.display = 'block';
}

export function closeContactModal() {
    document.getElementById('contact-modal').style.display = 'none';
    document.getElementById('contact-form').reset();
    document.getElementById('contact-id').value = '';
}

export async function addContact(contact) {
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

export async function editContact(id) {
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

export async function updateContact(updatedContact) {
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

export async function deleteContact(id) {
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