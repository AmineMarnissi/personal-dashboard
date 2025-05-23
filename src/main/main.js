const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const DatabaseInitializer = require('../../database/seeders/init-db');

let mainWindow;
let db;

// Database initialization using the new DatabaseInitializer class
async function initializeDatabase() {
    try {
        const dbPath = path.join(app.getPath('userData'), 'dashboard.db');
        console.log('Database path:', dbPath);
        
        const dbInit = new DatabaseInitializer(dbPath);
        db = await dbInit.initialize();
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        dialog.showErrorBox('Database Error', 'Failed to initialize database: ' + error.message);
        app.quit();
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icon.png'), // Add your app icon
        show: false
    });

    mainWindow.loadFile('src/renderer/index.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App event listeners
app.whenReady().then(async () => {
    await initializeDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                }
            });
        }
        app.quit();
    }
});

// Database operations via IPC
ipcMain.handle('db-get-all', async (event, table) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table} ORDER BY created_at DESC`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-by-id', async (event, table, id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
});

ipcMain.handle('db-insert', async (event, table, data) => {
    return new Promise((resolve, reject) => {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        db.run(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
});

ipcMain.handle('db-update', async (event, table, id, data) => {
    return new Promise((resolve, reject) => {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        
        db.run(`UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

ipcMain.handle('db-delete', async (event, table, id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

// Custom queries for dashboard
ipcMain.handle('db-get-recent-activities', async (event, limit = 10) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM activities ORDER BY created_at DESC LIMIT ?`, [limit], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-expense-categories', async (event) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT category, SUM(amount) as total 
            FROM expenses 
            GROUP BY category 
            ORDER BY total DESC
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-monthly-expenses', async (event) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(amount) as total
            FROM expenses 
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-project-status-counts', async (event) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT status, COUNT(*) as count 
            FROM projects 
            GROUP BY status
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-training-weekly', async (event) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                strftime('%Y-W%W', date) as week,
                SUM(duration) as total_duration,
                SUM(calories_burned) as total_calories
            FROM training 
            GROUP BY strftime('%Y-W%W', date)
            ORDER BY week DESC
            LIMIT 12
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// New queries for enhanced functionality
ipcMain.handle('db-get-goals', async (event) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT *, 
                   ROUND((current_value * 100.0 / target_value), 2) as progress_percentage
            FROM goals 
            WHERE status = 'active'
            ORDER BY deadline ASC
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-get-habits-with-today', async (event) => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0];
        
        db.all(`
            SELECT h.*, 
                   COALESCE(he.completed, 0) as completed_today
            FROM habits h
            LEFT JOIN habit_entries he ON h.id = he.habit_id AND he.date = ?
            WHERE h.is_active = 1
            ORDER BY h.name
        `, [today], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('db-update-habit-entry', async (event, habitId, date, completed) => {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT OR REPLACE INTO habit_entries (habit_id, date, completed)
            VALUES (?, ?, ?)
        `, [habitId, date, completed ? 1 : 0], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

ipcMain.handle('db-search', async (event, table, searchTerm, columns) => {
    return new Promise((resolve, reject) => {
        const whereClause = columns.map(col => `${col} LIKE ?`).join(' OR ');
        const searchValues = columns.map(() => `%${searchTerm}%`);
        
        db.all(`SELECT * FROM ${table} WHERE ${whereClause} ORDER BY created_at DESC`, searchValues, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Database backup functionality
ipcMain.handle('db-backup', async (event) => {
    try {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Backup Database',
            defaultPath: `dashboard-backup-${new Date().toISOString().split('T')[0]}.db`,
            filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (filePath) {
            const dbInit = new DatabaseInitializer('');
            dbInit.db = db; // Use existing connection
            await dbInit.backupDatabase(filePath);
            return { success: true, path: filePath };
        }
        
        return { success: false, cancelled: true };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message };
    }
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox('Unexpected Error', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});