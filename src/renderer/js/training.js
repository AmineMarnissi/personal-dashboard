import { addActivity } from './activity.js';
import { renderDashboard } from './dashboard.js';
// Training Functions
let trainingChart;
export async function renderTraining() {
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

export function openTrainingModal(editing = false) {
    document.getElementById('training-modal-title').textContent = editing ? 'Edit Training' : 'Add Training';
    document.getElementById('training-modal').style.display = 'block';
}

export function closeTrainingModal() {
    document.getElementById('training-modal').style.display = 'none';
    document.getElementById('training-form').reset();
    document.getElementById('training-id').value = '';
}

export async function addTraining(training) {
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

export async function editTraining(id) {
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

export async function updateTraining(updatedTraining) {
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

export async function deleteTraining(id) {
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