const crypto = require('crypto');
const bcrypt = require('bcrypt');

class AuthService {
    constructor(db) {
        this.db = db;
        this.saltRounds = 12;
        this.maxFailedAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Créer un utilisateur
    async registerUser(userData) {
        const { username, email, password, first_name, last_name } = userData;
        
        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await this.getUserByUsernameOrEmail(username, email);
            if (existingUser) {
                throw new Error('Un utilisateur avec ce nom d\'utilisateur ou email existe déjà');
            }

            // Valider le mot de passe
            this.validatePassword(password);

            // Hasher le mot de passe
            const salt = await bcrypt.genSalt(this.saltRounds);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insérer l'utilisateur
            const result = await this.runQuery(`
                INSERT INTO users (username, email, password_hash, salt, first_name, last_name)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [username, email, passwordHash, salt, first_name, last_name]);

            return { success: true, userId: result.lastID };
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            throw error;
        }
    }
    // Mettre à jour le profil utilisateur
    async updateUserProfile(userId, data) {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
    
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values, userId], function(err) {
                if (err) reject(err);
                else  resolve({ success: true });
            });
        });
    }
    
    // Authentifier un utilisateur
    async authenticateUser(username, password) {
        try {
            const user = await this.getUserByUsernameOrEmail(username, username);
            
            if (!user) {
                throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
            }

            // Vérifier si le compte est verrouillé
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const unlockTime = new Date(user.locked_until).toLocaleTimeString();
                throw new Error(`Compte verrouillé jusqu'à ${unlockTime}`);
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            
            if (!isPasswordValid) {
                await this.handleFailedLogin(user.id);
                throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
            }

            // Réinitialiser les tentatives échouées
            await this.resetFailedAttempts(user.id);

            // Créer une session
            const sessionToken = await this.createUserSession(user.id);

            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                sessionToken
            };
        } catch (error) {
            console.error('Erreur lors de l\'authentification:', error);
            throw error;
        }
    }

    // Créer une session utilisateur
    async createUserSession(userId) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.sessionDuration);

        await this.runQuery(`
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        `, [userId, sessionToken, expiresAt.toISOString()]);

        return sessionToken;
    }

    // Valider une session
    async validateSession(sessionToken) {
        try {
            const session = await this.getQuery(`
                SELECT s.*, u.id as user_id, u.username, u.email, u.first_name, u.last_name
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.is_active = 1 AND s.expires_at > datetime('now')
            `, [sessionToken]);

            if (!session) {
                return null;
            }

            return {
                id: session.user_id,
                username: session.username,
                email: session.email,
                firstName: session.first_name,
                lastName: session.last_name
            };
        } catch (error) {
            console.error('Erreur lors de la validation de session:', error);
            return null;
        }
    }

    // Déconnexion
    async logout(sessionToken) {
        try {
            await this.runQuery(`
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE session_token = ?
            `, [sessionToken]);
            
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            throw error;
        }
    }

    // Changer le mot de passe
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier le mot de passe actuel
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                throw new Error('Mot de passe actuel incorrect');
            }

            // Valider le nouveau mot de passe
            this.validatePassword(newPassword);

            // Hasher le nouveau mot de passe
            const salt = await bcrypt.genSalt(this.saltRounds);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // Mettre à jour
            await this.runQuery(`
                UPDATE users 
                SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newPasswordHash, salt, userId]);

            // Invalider toutes les sessions existantes
            await this.runQuery(`
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE user_id = ?
            `, [userId]);

            return { success: true };
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            throw error;
        }
    }

    // Méthodes utilitaires
    async handleFailedLogin(userId) {
        const user = await this.getUserById(userId);
        const failedAttempts = (user.failed_attempts || 0) + 1;
        
        let lockedUntil = null;
        if (failedAttempts >= this.maxFailedAttempts) {
            lockedUntil = new Date(Date.now() + this.lockoutDuration).toISOString();
        }

        await this.runQuery(`
            UPDATE users 
            SET failed_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [failedAttempts, lockedUntil, userId]);
    }

    async resetFailedAttempts(userId) {
        await this.runQuery(`
            UPDATE users 
            SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);
    }

    async updateLastLogin(userId) {
        await this.runQuery(`
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);
    }

    validatePassword(password) {
        if (!password || password.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins une lettre minuscule');
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins une lettre majuscule');
        }
        
        if (!/(?=.*\d)/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins un chiffre');
        }
    }

    // Méthodes de base de données
    async getUserByUsernameOrEmail(username, email) {
        return await this.getQuery(`
            SELECT * FROM users 
            WHERE username = ? OR email = ?
        `, [username, email]);
    }

    async getUserById(userId) {
        return await this.getQuery(`
            SELECT * FROM users WHERE id = ?
        `, [userId]);
    }

    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = AuthService;