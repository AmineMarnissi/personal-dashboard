
// Helper function for activity log
export async function addActivity(category, description) {
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