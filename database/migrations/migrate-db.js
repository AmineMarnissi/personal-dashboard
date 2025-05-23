const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseMigration {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getCurrentVersion() {
        try {
            // Check if migrations table exists
            const tableExists = await this.runQuery(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='migrations'
            `);

            if (tableExists.length === 0) {
                // Create migrations table
                await this.runQuery(`
                    CREATE TABLE migrations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        version INTEGER NOT NULL UNIQUE,
                        name TEXT NOT NULL,
                        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                return 0;
            }

            // Get current version
            const result = await this.runQuery(`
                SELECT MAX(version) as version FROM migrations
            `);
            
            return result[0]?.version || 0;
        } catch (error) {
            console.error('Error getting current version:', error);
            return 0;
        }
    }

    async applyMigration(version, name, migrationSQL) {
        try {
            console.log(`Applying migration ${version}: ${name}`);
            
            // Execute migration
            await this.runQuery(migrationSQL);
            
            // Record migration
            await this.runQuery(`
                INSERT INTO migrations (version, name) VALUES (?, ?)
            `, [version, name]);
            
            console.log(`✓ Migration ${version} applied successfully`);
        } catch (error) {
            console.error(`✗ Migration ${version} failed:`, error);
            throw error;
        }
    }

    async migrate() {
        await this.connect();
        const currentVersion = await this.getCurrentVersion();
        console.log(`Current database version: ${currentVersion}`);

        const migrations = this.getMigrations();
        const pendingMigrations = migrations.filter(m => m.version > currentVersion);

        if (pendingMigrations.length === 0) {
            console.log('Database is up to date');
            return;
        }

        console.log(`Applying ${pendingMigrations.length} migrations...`);

        for (const migration of pendingMigrations) {
            await this.applyMigration(migration.version, migration.name, migration.sql);
        }

        console.log('All migrations applied successfully');
    }

    getMigrations() {
        return [
            {
                version: 1,
                name: 'Add updated_at columns',
                sql: `
                    ALTER TABLE expenses ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                    ALTER TABLE ideas ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                    ALTER TABLE projects ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                    ALTER TABLE training ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                    ALTER TABLE contacts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                `
            },
            {
                version: 2,
                name: 'Add enhanced fields to existing tables',
                sql: `
                    ALTER TABLE ideas ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'implemented'));
                    ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK(completion_percentage >= 0 AND completion_percentage <= 100);
                    ALTER TABLE training ADD COLUMN calories_burned INTEGER;
                    ALTER TABLE training ADD COLUMN intensity TEXT CHECK(intensity IN ('low', 'medium', 'high'));
                    ALTER TABLE contacts ADD COLUMN company TEXT;
                    ALTER TABLE contacts ADD COLUMN job_title TEXT;
                    ALTER TABLE contacts ADD COLUMN address TEXT;
                    ALTER TABLE contacts ADD COLUMN is_favorite BOOLEAN DEFAULT 0;
                `
            },
            {
                version: 3,
                name: 'Create goals table',
                sql: `
                    CREATE TABLE IF NOT EXISTS goals (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT,
                        target_value REAL,
                        current_value REAL DEFAULT 0,
                        unit TEXT,
                        category TEXT NOT NULL,
                        deadline TEXT,
                        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'cancelled')),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `
            },
            {
                version: 4,
                name: 'Create habits and habit_entries tables',
                sql: `
                    CREATE TABLE IF NOT EXISTS habits (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        frequency TEXT NOT NULL,
                        target_count INTEGER DEFAULT 1,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS habit_entries (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        habit_id INTEGER NOT NULL,
                        date TEXT NOT NULL,
                        completed BOOLEAN DEFAULT 0,
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
                        UNIQUE(habit_id, date)
                    );
                `
            },
            {
                version: 5,
                name: 'Add metadata column to activities',
                sql: `
                    ALTER TABLE activities ADD COLUMN metadata TEXT;
                `
            },
            {
                version: 6,
                name: 'Create database indexes',
                sql: `
                    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
                    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
                    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
                    CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
                    CREATE INDEX IF NOT EXISTS idx_training_date ON training(date);
                    CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
                    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
                    CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
                    CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(date);
                    CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON habit_entries(habit_id);
                `
            }
        ];
    }

    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Export for use in other files
module.exports = DatabaseMigration;

// Run migrations if called directly
if (require.main === module) {
    const { app } = require('electron');
    const dbPath = path.join(app ? app.getPath('userData') : '.', 'dashboard.db');
    
    const migration = new DatabaseMigration(dbPath);
    
    migration.migrate()
        .then(() => {
            console.log('Migration completed successfully');
            return migration.close();
        })
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            migration.close().then(() => process.exit(1));
        });
}