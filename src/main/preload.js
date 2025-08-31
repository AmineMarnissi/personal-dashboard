const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    dbGetAll: (table) => ipcRenderer.invoke('db-get-all', table),
    dbGetById: (table, id) => ipcRenderer.invoke('db-get-by-id', table, id),
    dbInsert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
    dbUpdate: (table, id, data) => ipcRenderer.invoke('db-update', table, id, data),
    dbDelete: (table, id) => ipcRenderer.invoke('db-delete', table, id),

    // Add the new fixDatabase method
    fixDatabase: () => ipcRenderer.invoke('fix-database'),

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
    },

    // ✅ Auth API (corrected)
    auth: {
        register: (userData) => ipcRenderer.invoke('auth-register', userData),
        login: (username, password) => ipcRenderer.invoke('auth-login', username, password),
        validateSession: (sessionToken) => ipcRenderer.invoke('auth-validate-session', sessionToken),
        logout: (sessionToken) => ipcRenderer.invoke('auth-logout', sessionToken),
        changePassword: (userId, currentPassword, newPassword) =>
            ipcRenderer.invoke('auth-change-password', userId, currentPassword, newPassword),
        getCurrentUser: () => ipcRenderer.invoke('auth-get-current-user'),
        updateProfile: (userId, profileData) => ipcRenderer.invoke('auth-update-profile', userId, profileData)
    },
      // ✅ Redirection vers le dashboard après login
    loadMainDashboard: () => ipcRenderer.invoke('app-show-dashboard'),
    
    chat: {
        askGPT: (message) => ipcRenderer.invoke('chat-ask-gpt', message)
      },
        news: {
          getFeed: () => ipcRenderer.invoke('get-news-feed')
        }
      

});
