const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    dbGetAll: (table) => ipcRenderer.invoke('db-get-all', table),
    dbGetById: (table, id) => ipcRenderer.invoke('db-get-by-id', table, id),
    dbInsert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
    dbUpdate: (table, id, data) => ipcRenderer.invoke('db-update', table, id, data),
    dbDelete: (table, id) => ipcRenderer.invoke('db-delete', table, id),
    
    // Dashboard specific queries
    dbGetRecentActivities: (limit) => ipcRenderer.invoke('db-get-recent-activities', limit),
    dbGetExpenseCategories: () => ipcRenderer.invoke('db-get-expense-categories'),
    dbGetMonthlyExpenses: () => ipcRenderer.invoke('db-get-monthly-expenses'),
    dbGetProjectStatusCounts: () => ipcRenderer.invoke('db-get-project-status-counts'),
    dbGetTrainingWeekly: () => ipcRenderer.invoke('db-get-training-weekly'),
    
    // Search functionality
    dbSearch: (table, searchTerm, columns) => ipcRenderer.invoke('db-search', table, searchTerm, columns),
    
    // Utility functions
    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    },
    
    getCurrentDate: () => {
        return new Date().toISOString().split('T')[0];
    }
});