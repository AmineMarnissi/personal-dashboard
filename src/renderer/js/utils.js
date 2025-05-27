// js/utils.js
console.log('🔧 Utils module loading...');

const UtilsModule = {
    init() {
        console.log('🔧 Utils module initialized');
        // Setup utility functions
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // Add your notification logic here
    }
};

window.UtilsModule = UtilsModule;