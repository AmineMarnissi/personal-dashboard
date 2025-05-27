// Template loader utility for loading HTML templates dynamically
class TemplateLoader {
    constructor() {
        this.cache = new Map();
        this.contentContainer = document.getElementById('content-container');
        this.modalContainer = document.getElementById('modal-container');
    }

    // Load a template from the templates directory
    async loadTemplate(templatePath) {
        try {
            // Check cache first
            if (this.cache.has(templatePath)) {
                return this.cache.get(templatePath);
            }

            const response = await fetch(`templates/${templatePath}`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templatePath}`);
            }
            
            const html = await response.text();
            
            // Cache the template
            this.cache.set(templatePath, html);
            
            return html;
        } catch (error) {
            console.error('Error loading template:', error);
            return `<div class="error">Failed to load template: ${templatePath}</div>`;
        }
    }

    // Load and display a tab content template
    async loadTabContent(tabName) {
        const templatePath = `${tabName}.html`;
        const html = await this.loadTemplate(templatePath);
        
        if (this.contentContainer) {
            this.contentContainer.innerHTML = html;
            
            // Trigger custom event for loaded content
            this.contentContainer.dispatchEvent(new CustomEvent('contentLoaded', {
                detail: { tabName, html }
            }));
        }
        
        return html;
    }

    // Load and display a modal template
    async loadModal(modalName) {
        const templatePath = `modals/${modalName}-modal.html`;
        const html = await this.loadTemplate(templatePath);
        
        if (this.modalContainer) {
            // Check if modal already exists
            const existingModal = this.modalContainer.querySelector(`#${modalName}-modal`);
            if (!existingModal) {
                this.modalContainer.insertAdjacentHTML('beforeend', html);
            }
        }
        
        return html;
    }

    // Preload multiple templates
    async preloadTemplates(templatePaths) {
        const promises = templatePaths.map(path => this.loadTemplate(path));
        return Promise.all(promises);
    }

    // Clear template cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached template
    getCachedTemplate(templatePath) {
        return this.cache.get(templatePath);
    }

    // Check if template is cached
    isTemplateCached(templatePath) {
        return this.cache.has(templatePath);
    }
}

// Create global instance
const templateLoader = new TemplateLoader();

// Export for use in other modules
export default templateLoader;