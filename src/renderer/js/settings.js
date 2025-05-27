import { initializeProfile } from './profile.js';
// Settings data storage
export let settingsData = {
    theme: 'light',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    desktopNotifications: true,
    emailNotifications: false,
    taskReminders: true,
    expenseAlerts: true,
    autoLock: 'never',
    autoBackup: true,
    analyticsSharing: false,
    compactView: false,
    showSidebar: true,
    fontSize: 'medium'
};
// Initialize settings on page load
export function initializeSettings() {
    // Populate settings form with current data
    document.getElementById('theme-select').value = settingsData.theme;
    document.getElementById('language-select').value = settingsData.language;
    document.getElementById('currency-select').value = settingsData.currency;
    document.getElementById('date-format-select').value = settingsData.dateFormat;
    document.getElementById('desktop-notifications').checked = settingsData.desktopNotifications;
    document.getElementById('email-notifications').checked = settingsData.emailNotifications;
    document.getElementById('task-reminders').checked = settingsData.taskReminders;
    document.getElementById('expense-alerts').checked = settingsData.expenseAlerts;
    document.getElementById('auto-lock-select').value = settingsData.autoLock;
    document.getElementById('auto-backup').checked = settingsData.autoBackup;
    document.getElementById('analytics-sharing').checked = settingsData.analyticsSharing;
    document.getElementById('compact-view').checked = settingsData.compactView;
    document.getElementById('show-sidebar').checked = settingsData.showSidebar;
    document.getElementById('font-size-select').value = settingsData.fontSize;
    
    // Apply current settings
    applyTheme(settingsData.theme);
    applyFontSize(settingsData.fontSize);
}

function applyTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.className = prefersDark ? 'dark-theme' : '';
    }
}

function applyFontSize(size) {
    const sizeMap = {
        'small': '14px',
        'medium': '16px',
        'large': '18px',
        'extra-large': '20px'
    };
    document.documentElement.style.fontSize = sizeMap[size] || '16px';
}

   
export function setupSettingsHandlers() {
    // Theme change handler
    document.getElementById('theme-select').addEventListener('change', function(e) {
        settingsData.theme = e.target.value;
        applyTheme(settingsData.theme);
    });

    // Language change handler
    document.getElementById('language-select').addEventListener('change', function(e) {
        settingsData.language = e.target.value;
        // You can implement language switching logic here
    });

    // Currency change handler
    document.getElementById('currency-select').addEventListener('change', function(e) {
        settingsData.currency = e.target.value;
    });

    // Date format change handler
    document.getElementById('date-format-select').addEventListener('change', function(e) {
        settingsData.dateFormat = e.target.value;
    });

    // Font size change handler
    document.getElementById('font-size-select').addEventListener('change', function(e) {
        settingsData.fontSize = e.target.value;
        applyFontSize(settingsData.fontSize);
    });

    // Toggle switches
    const toggles = [
        'desktop-notifications', 'email-notifications', 'task-reminders', 
        'expense-alerts', 'auto-backup', 'analytics-sharing', 
        'compact-view', 'show-sidebar'
    ];

    toggles.forEach(toggleId => {
        document.getElementById(toggleId).addEventListener('change', function(e) {
            const settingKey = toggleId.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            });
            settingsData[settingKey] = e.target.checked;
        });
    });

    // Auto-lock change handler
    document.getElementById('auto-lock-select').addEventListener('change', function(e) {
        settingsData.autoLock = e.target.value;
    });

    // Data management buttons
    document.getElementById('export-data-btn').addEventListener('click', function() {
        exportData();
    });

    document.getElementById('import-data-btn').addEventListener('click', function() {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', function(e) {
        importData(e.target.files[0]);
    });

    document.getElementById('clear-data-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            clearAllData();
        }
    });

    // 2FA setup
    document.getElementById('setup-2fa-btn').addEventListener('click', function() {
        alert('2FA setup would be implemented here with proper authentication flow.');
    });

    // About section buttons
    document.getElementById('check-updates-btn').addEventListener('click', function() {
        alert('Checking for updates... You are using the latest version!');
    });

    document.getElementById('view-license-btn').addEventListener('click', function() {
        alert('License information would be displayed here.');
    });

    document.getElementById('contact-support-btn').addEventListener('click', function() {
        alert('Support contact information would be displayed here.');
    });
}

function exportData() {
    const data = {
        profile: profileData,
        settings: settingsData,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'personal-manager-data.json';
    link.click();
    
    alert('Data exported successfully!');
}

function importData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.profile) {
                Object.assign(profileData, data.profile);
                initializeProfile();
            }
            
            if (data.settings) {
                Object.assign(settingsData, data.settings);
                initializeSettings();
            }
            
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing data: Invalid file format');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    // Reset profile data
    profileData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        job: 'Product Manager',
        department: 'Technology',
        location: 'New York, NY',
        bio: 'Passionate about technology and innovation.',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        joined: 'January 15, 2024'
    };
    
    // Reset settings data
    settingsData = {
        theme: 'light',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        desktopNotifications: true,
        emailNotifications: false,
        taskReminders: true,
        expenseAlerts: true,
        autoLock: 'never',
        autoBackup: true,
        analyticsSharing: false,
        compactView: false,
        showSidebar: true,
        fontSize: 'medium'
    };
    
    // Reinitialize
    initializeProfile();
    initializeSettings();
    
    alert('All data has been cleared!');
}