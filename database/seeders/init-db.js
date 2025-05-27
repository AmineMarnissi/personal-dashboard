const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseInitializer {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    /**
     * Initialize the database connection and create tables
     */
    async initialize() {
        try {
            // Ensure the directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            console.log(`Initializing database at: ${this.dbPath}`);
            
            // Create database connection
            this.db = await this.createConnection();
            
            // Create all tables
            await this.createTables();
            
            // Create indexes for better performance
            await this.createIndexes();
            
            // Insert sample data if needed
            await this.insertSampleData();
            
            console.log('Database initialization completed successfully');
            return this.db;
            
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create database connection with proper error handling
     */
    createConnection() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    // Enable foreign keys
                    db.run('PRAGMA foreign_keys = ON');
                    resolve(db);
                }
            });
        });
    }

    /**
     * Create all required tables
     */
    async createTables() {
        const tables = this.getTableDefinitions();
        
        for (const [tableName, tableSQL] of Object.entries(tables)) {
            try {
                await this.runQuery(tableSQL);
                console.log(`✓ Table '${tableName}' created successfully`);
            } catch (error) {
                console.error(`✗ Error creating table '${tableName}':`, error);
                throw error;
            }
        }
    }

    /**
     * Get all table definitions
     */
    getTableDefinitions() {
        return {
            expenses: `
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL CHECK(amount >= 0),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            ideas: `
                CREATE TABLE IF NOT EXISTS ideas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    tags TEXT,
                    date TEXT NOT NULL,
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'implemented')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            projects: `
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    due_date TEXT,
                    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'progress', 'done', 'cancelled')),
                    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
                    completion_percentage INTEGER DEFAULT 0 CHECK(completion_percentage >= 0 AND completion_percentage <= 100),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            training: `
                CREATE TABLE IF NOT EXISTS training (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    activity TEXT NOT NULL,
                    duration INTEGER NOT NULL CHECK(duration > 0),
                    calories_burned INTEGER,
                    notes TEXT,
                    intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            contacts: `
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    category TEXT,
                    company TEXT,
                    job_title TEXT,
                    address TEXT,
                    notes TEXT,
                    is_favorite BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            activities: `
                CREATE TABLE IF NOT EXISTS activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT NOT NULL,
                    metadata TEXT, -- JSON string for additional data
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,

            crypto_trades: `
                CREATE TABLE IF NOT EXISTS crypto_trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    crypto TEXT NOT NULL,
                    buyDate TEXT NOT NULL,
                    sellDate TEXT NOT NULL,
                    buyPrice REAL NOT NULL CHECK(buyPrice > 0),
                    sellPrice REAL NOT NULL CHECK(sellPrice > 0),
                    quantity REAL NOT NULL CHECK(quantity > 0),
                    profit REAL NOT NULL,
                    percent REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,

            // New tables for enhanced functionality
            goals: `
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
                )
            `,

            habits: `
                CREATE TABLE IF NOT EXISTS habits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    frequency TEXT NOT NULL, -- daily, weekly, monthly
                    target_count INTEGER DEFAULT 1,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,

            habit_entries: `
                CREATE TABLE IF NOT EXISTS habit_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    habit_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    completed BOOLEAN DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
                    UNIQUE(habit_id, date)
                )
            `
        };
    }

    /**
     * Create indexes for better performance
     */
    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)',
            'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)',
            'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
            'CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date)',
            'CREATE INDEX IF NOT EXISTS idx_training_date ON training(date)',
            'CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)',
            'CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date)',
            'CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category)',
            'CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(date)',
            'CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON habit_entries(habit_id)',
            'CREATE INDEX IF NOT EXISTS idx_crypto_trades_crypto ON crypto_trades(crypto)',
            'CREATE INDEX IF NOT EXISTS idx_crypto_trades_buyDate ON crypto_trades(buyDate)',
            'CREATE INDEX IF NOT EXISTS idx_crypto_trades_sellDate ON crypto_trades(sellDate)'
        ];

        for (const indexSQL of indexes) {
            try {
                await this.runQuery(indexSQL);
            } catch (error) {
                console.error('Error creating index:', error);
            }
        }
        
        console.log('✓ Database indexes created');
    }

    /**
     * Insert sample data if tables are empty
     */
    async insertSampleData() {
        try {
            await this.insertSampleExpenses();
            await this.insertSampleIdeas();
            await this.insertSampleProjects();
            await this.insertSampleTraining();
            await this.insertSampleContacts();
            await this.insertSampleGoals();
            await this.insertSampleHabits();
            await this.insertSampleCryptoTrades();
        } catch (error) {
            console.error('Error inserting sample data:', error);
        }
    }

    async insertSampleExpenses() {
        const count = await this.getRowCount('expenses');
        if (count > 0) return;

        const sampleExpenses = [
            ['2025-05-15', 'Food', 'Grocery shopping at Whole Foods', 85.43],
            ['2025-05-17', 'Transportation', 'Gas station fill-up', 45.00],
            ['2025-05-18', 'Entertainment', 'Movie tickets for two', 28.50],
            ['2025-05-20', 'Utilities', 'Monthly electricity bill', 120.75],
            ['2025-05-21', 'Food', 'Dinner at restaurant', 67.20],
            ['2025-05-22', 'Shopping', 'New work clothes', 156.89]
        ];

        for (const expense of sampleExpenses) {
            await this.runQuery(
                'INSERT INTO expenses (date, category, description, amount) VALUES (?, ?, ?, ?)',
                expense
            );
        }
        
        console.log('✓ Sample expenses inserted');
    }

    async insertSampleIdeas() {
        const count = await this.getRowCount('ideas');
        if (count > 0) return;

        const sampleIdeas = [
            ['Learn Machine Learning', 'Focus on deep learning with TensorFlow and PyTorch', 'education,technology,AI,python', '2025-05-10'],
            ['Create Personal Website', 'Showcase portfolio and blog about tech topics', 'web development,portfolio,react', '2025-05-15'],
            ['Home Automation System', 'Build smart home system using Raspberry Pi', 'iot,electronics,python,home', '2025-05-18'],
            ['Mobile App Idea', 'Expense tracking app with AI categorization', 'mobile,fintech,AI,react-native', '2025-05-20']
        ];

        for (const idea of sampleIdeas) {
            await this.runQuery(
                'INSERT INTO ideas (title, description, tags, date) VALUES (?, ?, ?, ?)',
                idea
            );
        }
        
        console.log('✓ Sample ideas inserted');
    }

    async insertSampleProjects() {
        const count = await this.getRowCount('projects');
        if (count > 0) return;

        const sampleProjects = [
            ['Dashboard Development', 'Build a comprehensive personal dashboard app', '2025-06-15', 'progress', 'high', 75],
            ['Learn React Advanced', 'Complete advanced React course with hooks and context', '2025-07-01', 'todo', 'medium', 0],
            ['Home Office Setup', 'Organize and upgrade home office space', '2025-05-25', 'done', 'medium', 100],
            ['Side Project - Blog', 'Start a technical blog with weekly posts', '2025-08-15', 'todo', 'low', 10]
        ];

        for (const project of sampleProjects) {
            await this.runQuery(
                'INSERT INTO projects (title, description, due_date, status, priority, completion_percentage) VALUES (?, ?, ?, ?, ?, ?)',
                project
            );
        }
        
        console.log('✓ Sample projects inserted');
    }

    async insertSampleTraining() {
        const count = await this.getRowCount('training');
        if (count > 0) return;

        const sampleTraining = [
            ['2025-05-15', 'Running', 45, 350, '5k run in the park', 'medium'],
            ['2025-05-17', 'Weight Training', 60, 180, 'Upper body focus - chest, shoulders, triceps', 'high'],
            ['2025-05-19', 'Yoga', 30, 90, 'Morning hatha yoga session', 'low'],
            ['2025-05-21', 'Cycling', 90, 420, '15 mile bike ride on trails', 'medium'],
            ['2025-05-22', 'Swimming', 45, 300, '1000m freestyle practice', 'high']
        ];

        for (const session of sampleTraining) {
            await this.runQuery(
                'INSERT INTO training (date, activity, duration, calories_burned, notes, intensity) VALUES (?, ?, ?, ?, ?, ?)',
                session
            );
        }
        
        console.log('✓ Sample training sessions inserted');
    }

    async insertSampleContacts() {
        const count = await this.getRowCount('contacts');
        if (count > 0) return;

        const sampleContacts = [
            ['John Smith', 'john.smith@techcorp.com', '(555) 123-4567', 'Work', 'TechCorp Inc.', 'Project Manager', '123 Business St, City, ST 12345', 'Great project manager, very organized', 1],
            ['Sarah Johnson', 'sarah.j@email.com', '(555) 987-6543', 'Personal', null, 'Fitness Instructor', null, 'Personal trainer at local gym', 0],
            ['Mike Chen', 'mike.chen@startup.io', '(555) 456-7890', 'Business', 'StartupIO', 'CTO', null, 'Potential collaboration partner', 1],
            ['Emily Davis', 'emily@freelance.com', '(555) 321-9876', 'Freelance', null, 'Graphic Designer', null, 'Excellent designer for web projects', 0]
        ];

        for (const contact of sampleContacts) {
            await this.runQuery(
                'INSERT INTO contacts (name, email, phone, category, company, job_title, address, notes, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                contact
            );
        }
        
        console.log('✓ Sample contacts inserted');
    }

    async insertSampleGoals() {
        const count = await this.getRowCount('goals');
        if (count > 0) return;

        const sampleGoals = [
            ['Save for Emergency Fund', 'Build 6-month emergency fund', 10000, 3500, 'USD', 'Financial', '2025-12-31'],
            ['Read 24 Books This Year', 'Read at least 2 books per month', 24, 8, 'books', 'Personal', '2025-12-31'],
            ['Run a Half Marathon', 'Complete 13.1 mile race', 13.1, 5.2, 'miles', 'Fitness', '2025-09-15'],
            ['Learn Spanish', 'Achieve conversational level', 100, 25, 'lessons', 'Education', '2025-11-30']
        ];

        for (const goal of sampleGoals) {
            await this.runQuery(
                'INSERT INTO goals (title, description, target_value, current_value, unit, category, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
                goal
            );
        }
        
        console.log('✓ Sample goals inserted');
    }

    async insertSampleHabits() {
        const count = await this.getRowCount('habits');
        if (count > 0) return;

        const sampleHabits = [
            ['Morning Exercise', 'Start day with 30 minutes of exercise', 'daily', 1],
            ['Read Before Bed', 'Read for at least 20 minutes before sleeping', 'daily', 1],
            ['Meal Prep', 'Prepare healthy meals for the week', 'weekly', 1],
            ['Practice Meditation', 'Mindfulness meditation session', 'daily', 1]
        ];

        for (const habit of sampleHabits) {
            await this.runQuery(
                'INSERT INTO habits (name, description, frequency, target_count) VALUES (?, ?, ?, ?)',
                habit
            );
        }
        
        console.log('✓ Sample habits inserted');
    }

    async insertSampleCryptoTrades() {
        const count = await this.getRowCount('crypto_trades');
        if (count > 0) return;

        const sampleTrades = [
            ['Bitcoin', '2025-01-15', '2025-02-20', 42000.00, 48500.00, 0.5, 3250.00, 15.48],
            ['Ethereum', '2025-02-01', '2025-03-15', 2800.00, 3200.00, 2.0, 800.00, 14.29],
            ['Solana', '2025-01-20', '2025-02-10', 95.00, 110.00, 10.0, 150.00, 15.79],
            ['Cardano', '2025-02-15', '2025-03-25', 0.45, 0.52, 1000.0, 70.00, 15.56],
            ['Polygon', '2025-01-05', '2025-01-28', 0.85, 0.78, 500.0, -35.00, -8.24],
            ['Chainlink', '2025-03-01', '2025-03-20', 15.50, 18.20, 50.0, 135.00, 17.42]
        ];

        for (const trade of sampleTrades) {
            await this.runQuery(
                'INSERT INTO crypto_trades (crypto, buyDate, sellDate, buyPrice, sellPrice, quantity, profit, percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                trade
            );
        }
        
        console.log('✓ Sample crypto trades inserted');
    }

    /**
     * Utility method to run SQL queries with promises
     */
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

    /**
     * Get row count for a table
     */
    async getRowCount(tableName) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    /**
     * Backup database to a specified location
     */
    async backupDatabase(backupPath) {
        return new Promise((resolve, reject) => {
            const backupDb = new sqlite3.Database(backupPath);
            
            this.db.backup(backupDb, (err) => {
                backupDb.close();
                if (err) {
                    console.error('Backup failed:', err);
                    reject(err);
                } else {
                    console.log(`✓ Database backed up to: ${backupPath}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database connection (for use in main process)
     */
    getConnection() {
        return this.db;
    }
}

// Export the class for use in main.js
module.exports = DatabaseInitializer;

// If this file is run directly, initialize the database
if (require.main === module) {
    const { app } = require('electron');
    
    // Initialize database in user data directory
    const dbPath = path.join(app ? app.getPath('userData') : '.', 'dashboard.db');
    const dbInit = new DatabaseInitializer(dbPath);
    
    dbInit.initialize()
        .then(() => {
            console.log('Database initialization completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}