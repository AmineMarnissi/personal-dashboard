// auth.js

class AuthUI {
    constructor() {
        console.log('✅ AuthUI constructor');
        this.initializeEventListeners();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
    }

    initializeEventListeners() {
        console.log('✅ initializeEventListeners called');
        // Gestion des onglets
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Soumission des formulaires
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        console.log('login form:', document.getElementById('login-form'));
        console.log('login button:', document.getElementById('login-button'));

        // Mot de passe oublié
        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Validation en temps réel
        document.getElementById('register-confirm-password').addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    }

    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.dataset.target;
                const input = document.getElementById(targetId);
                
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.textContent = '🙈';
                } else {
                    input.type = 'password';
                    toggle.textContent = '👁️';
                }
            });
        });
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('register-password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = this.calculatePasswordStrength(password);
            
            strengthFill.className = 'strength-fill';
            
            if (password.length === 0) {
                strengthText.textContent = 'Saisissez un mot de passe';
                return;
            }

            switch (strength.level) {
                case 1:
                    strengthFill.classList.add('strength-weak');
                    strengthText.textContent = 'Faible';
                    break;
                case 2:
                    strengthFill.classList.add('strength-fair');
                    strengthText.textContent = 'Moyen';
                    break;
                case 3:
                    strengthFill.classList.add('strength-good');
                    strengthText.textContent = 'Bon';
                    break;
                case 4:
                    strengthFill.classList.add('strength-strong');
                    strengthText.textContent = 'Très fort';
                    break;
            }
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        Object.values(checks).forEach(check => {
            if (check) score++;
        });

        return {
            level: Math.min(4, Math.max(1, score - 1)),
            checks
        };
    }

    switchTab(tabName) {
        // Mise à jour des onglets
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mise à jour des formulaires
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabName}-form`).classList.add('active');

        this.hideMessages();
    }

    async handleLogin(event) {
        event.preventDefault();
    
        const button = document.getElementById('login-button');
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
    
        if (!this.validateLoginForm(username, password)) {
            return;
        }
    
        this.setLoading(button, true);
        this.hideMessages();
    
        try {
            const result = await window.authManager.login(username, password);

    
            if (result.success) {
                this.showSuccess('Connexion réussie ! Redirection...');
                // Pas besoin d'appeler redirectToDashboard ici
            } else {
                this.showError(result.error);
                this.shakeForm('login-form');
            }
        } catch (error) {
            this.showError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            this.setLoading(button, false);
        }
    }
    

    async handleRegister(event) {
        event.preventDefault();
        
        const button = document.getElementById('register-button');
        const formData = {
            firstName: document.getElementById('register-firstname').value,
            lastName: document.getElementById('register-lastname').value,
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            confirmPassword: document.getElementById('register-confirm-password').value
        };

        if (!this.validateRegisterForm(formData)) {
            return;
        }

        this.setLoading(button, true);
        this.hideMessages();

        try {
            const result = await window.electronAPI.auth.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName
            });
        
            if (result.success) {
                this.showSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        
                setTimeout(() => {
                    this.switchTab('login');
                    document.getElementById('login-username').value = formData.username;
                }, 2000);
            } else {
                this.showError(result.error || 'Erreur inconnue lors de l’inscription.');
                this.shakeForm('register-form');
            }
        } catch (error) {
            this.showError('Erreur lors de la création du compte. Veuillez réessayer.');
        }
        
    }

    validateLoginForm(username, password) {
        if (!username.trim()) {
            this.showError('Veuillez saisir votre nom d\'utilisateur ou email.');
            this.highlightField('login-username');
            return false;
        }

        if (!password) {
            this.showError('Veuillez saisir votre mot de passe.');
            this.highlightField('login-password');
            return false;
        }

        return true;
    }

    validateRegisterForm(data) {
        if (!data.firstName.trim()) {
            this.showError('Veuillez saisir votre prénom.');
            this.highlightField('register-firstname');
            return false;
        }

        if (!data.lastName.trim()) {
            this.showError('Veuillez saisir votre nom.');
            this.highlightField('register-lastname');
            return false;
        }

        if (!data.username.trim()) {
            this.showError('Veuillez choisir un nom d\'utilisateur.');
            this.highlightField('register-username');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            this.showError('Veuillez saisir une adresse email valide.');
            this.highlightField('register-email');
            return false;
        }

        const passwordStrength = this.calculatePasswordStrength(data.password);
        if (passwordStrength.level < 2) {
            this.showError('Le mot de passe doit être plus fort.');
            this.highlightField('register-password');
            return false;
        }

        if (data.password !== data.confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas.');
            this.highlightField('register-confirm-password');
            return false;
        }

        return true;
    }

    validatePasswordMatch() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const confirmInput = document.getElementById('register-confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('error');
        } else {
            confirmInput.classList.remove('error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    highlightField(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.add('error', 'shake');
        field.focus();
        
        setTimeout(() => {
            field.classList.remove('shake');
        }, 500);

        field.addEventListener('input', () => {
            field.classList.remove('error');
        }, { once: true });
    }

    shakeForm(formId) {
        const form = document.getElementById(formId);
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        successElement.textContent = message;
        successElement.classList.add('show');
    }

    hideMessages() {
        document.getElementById('error-message').classList.remove('show');
        document.getElementById('success-message').classList.remove('show');
    }

    handleForgotPassword() {
        alert('Fonctionnalité de récupération de mot de passe à implémenter.');
    }

    async simulateLogin(username, password) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        if (username === 'admin' && password === 'password123') {
            const fakeUser = {
                username: 'admin',
                first_name: 'Test',
                last_name: 'User'
            };
            const fakeToken = 'demo-token';
    
            // ✅ Mettre à jour le main process
            await window.electronAPI.auth.login(username, password); // ← simule le login pour le main process
    
            // ✅ Ensuite, rediriger
            await window.electronAPI.loadMainDashboard();
    
            return {
                success: true,
                user: fakeUser
            };
        } else {
            return {
                success: false,
                error: 'Nom d\'utilisateur ou mot de passe incorrect.'
            };
        }
    }
    
    
    async simulateRegister(userData) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation de délai réseau
        
        // Simulation d'une réponse d'API
        return {
            success: true,
            message: 'Compte créé avec succès'
        };
    }

    redirectToDashboard(user) {
        // Remplacez par votre logique de redirection
        console.log('Redirection vers le dashboard pour:', user);
        alert(`Bienvenue ${user.firstName} ${user.lastName} !`);
    }
}

// Initialisation de l'interface d'authentification
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Ready - AuthUI initialized');
    new AuthUI();
});