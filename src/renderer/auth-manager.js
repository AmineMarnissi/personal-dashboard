class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
    }

    // Initialiser l'authentification
    async initialize() {
        const savedToken = localStorage.getItem('sessionToken');
        if (savedToken) {
            const result = await window.electronAPI.auth.validateSession(savedToken);
            if (result.success) {
                this.setAuthenticatedUser(result.user, savedToken);
                return true;
            } else {
                localStorage.removeItem('sessionToken');
            }
        }
        return false;
    }

    // Connexion
    async login(username, password) {
        try {
            const result = await window.electronAPI.auth.login(username, password);
            
            if (result.success) {
                this.setAuthenticatedUser(result.user, result.sessionToken);
                localStorage.setItem('sessionToken', result.sessionToken);
    
                // ✅ Rediriger vers le dashboard complet (index.ejs)
                await window.electronAPI.loadMainDashboard();
    
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: 'Erreur de connexion' };
        }
    }
    
    // Inscription
    async register(userData) {
        try {
            const result = await window.electronAPI.auth.register(userData);
            return result;
        } catch (error) {
            return { success: false, error: 'Erreur lors de l\'inscription' };
        }
    }

    // Mettre à jour le profil utilisateur
    async updateProfile(profileData) {
        if (!this.currentUser || !this.sessionToken) {
            return { success: false, error: 'Utilisateur non authentifié' };
        }

        try {
            const result = await window.electronAPI.auth.updateProfile(this.currentUser.id, profileData);
            if (result.success) {
                // Met à jour localement les données utilisateur
                Object.assign(this.currentUser, profileData);
                this.updateUserInterface();
            }
            return result;
        } catch (error) {
            return { success: false, error: 'Erreur lors de la mise à jour du profil' };
        }
    }
    
    // Déconnexion
    async logout() {
        if (this.sessionToken) {
            await window.electronAPI.auth.logout(this.sessionToken);
        }
        
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('sessionToken');
        
        this.showLoginForm();
    }

    // Définir l'utilisateur authentifié
    setAuthenticatedUser(user, token) {
        this.currentUser = user;
        this.sessionToken = token;
        this.isAuthenticated = true;
        
        // Mettre à jour l'interface utilisateur
        this.updateUserInterface();
    }

    // Mettre à jour l'interface utilisateur
    updateUserInterface() {
        if (this.isAuthenticated && this.currentUser) {
            // Mettre à jour le nom d'utilisateur dans la topbar
            const userNameElement = document.querySelector('.topbar .profile span:nth-of-type(1)');
            if (userNameElement) {
                userNameElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim() || this.currentUser.username;
            }
            
            // Vous pouvez ajouter d'autres mises à jour d'interface ici
        }
    }

    // Afficher le formulaire de connexion
    showLoginForm() {
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('auth-container').style.display = 'flex';
    }

    // Afficher le dashboard
    showDashboard() {
        console.log('→ showDashboard called');
        const authContainer = document.getElementById('auth-container');
        const mainContent = document.getElementById('main-content');
    
        if (authContainer && mainContent) {
            authContainer.style.display = 'none';
            mainContent.style.display = 'block';
        } else {
            console.warn('⚠️ auth-container ou main-content introuvable dans le DOM');
        }
    }
    
    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est authentifié
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Instance globale
window.authManager = new AuthManager();
