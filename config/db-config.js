const path = require('path');
const os = require('os');

/**
 * Database configuration settings
 */
const DB_CONFIG = {
    // Database file name
    filename: 'dashboard.db',
    
    // Development vs Production paths
    development: {
        path: path.join(process.cwd(), 'data'),
        filename: 'dashboard-dev.db'
    },
    
    production: {
        // Use Electron's userData directory in production
        path: null, // Will be set by Electron app.getPath('userData')
        filename: 'dashboard.db'
    },
    
    // Backup settings
    backup: {
        // Automatic backup interval in hours (0 to disable)
        autoBackupInterval: 24,
        
        // Maximum number of backup files to keep
        maxBackupFiles: 7,
        
        // Backup file naming pattern
        backupPattern: 'dashboard-backup-{timestamp}.db'
    },
    
    // SQLite settings
    sqlite: {
        // Enable WAL mode for better concurrency
        walMode: true,
        
        // Enable foreign key constraints
        foreignKeys: true,
        
        // Synchronous mode (NORMAL is good balance of safety and speed)
        synchronous: 'NORMAL',
        
        // Journal mode
        journalMode: 'WAL',
        
        // Cache size in KB
        cacheSize: 10000,
        
        // Timeout for busy database (ms)
        busyTimeout: 30000
    },
    
    // Migration settings
    migration: {
        // Enable automatic migrations on startup
        autoMigrate: true,
        
        // Backup before migration
        backupBeforeMigration: true
    },
    
    // Logging
    logging: {
        // Enable query logging in development
        logQueries: process.env.NODE_ENV === 'development',
        
        // Enable performance monitoring
        logPerformance: true,
        
        // Slow query threshold in milliseconds
        slowQueryThreshold: 1000
    }
};

/**
 * Get database path based on environment
 */
function getDatabasePath(app = null) {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
    
    if (isDevelopment) {
        // Development: use local data directory
        const dataDir = DB_CONFIG.development.path;
        const fs = require('fs');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        return path.join(dataDir, DB_CONFIG.development.filename);
    } else {
        // Production: use Electron's userData directory
        if (!app) {
            throw new Error('Electron app instance required for production database path');
        }
        
        return path.join(app.getPath('userData'), DB_CONFIG.production.filename);
    }
}

/**
 * Get backup file path
 */
function getBackupPath(originalPath, timestamp = null) {
    const dir = path.dirname(originalPath);
    const timestamp_str = timestamp || new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFilename = DB_CONFIG.backup.backupPattern.replace('{timestamp}', timestamp_str);
    
    return path.join(dir, 'backups', backupFilename);
}

/**
 * Get SQLite pragma commands based on configuration
 */
function getSQLitePragmas() {
    const pragmas = [];
    
    if (DB_CONFIG.sqlite.foreignKeys) {
        pragmas.push('PRAGMA foreign_keys = ON');
    }
    
    if (DB_CONFIG.sqlite.walMode && DB_CONFIG.sqlite.journalMode === 'WAL') {
        pragmas.push('PRAGMA journal_mode = WAL');
    }
    
    pragmas.push(`PRAGMA synchronous = ${DB_CONFIG.sqlite.synchronous}`);
    pragmas.push(`PRAGMA cache_size = ${DB_CONFIG.sqlite.cacheSize}`);
    pragmas.push(`PRAGMA busy_timeout = ${DB_CONFIG.sqlite.busyTimeout}`);
    
    return pragmas;
}

/**
 * Database schema validation
 */
const REQUIRED_TABLES = [
    'expenses',
    'ideas', 
    'projects',
    'training',
    'contacts',
    'activities'
];

const OPTIONAL_TABLES = [
    'goals',
    'habits',
    'habit_entries',
    'migrations'
];

/**
 * Validate database schema
 */
async function validateSchema(db) {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                reject(err);
                return;
            }
            
            const tableNames = tables.map(t => t.name);
            const missingTables = REQUIRED_TABLES.filter(table => !tableNames.includes(table));
            
            if (missingTables.length > 0) {
                reject(new Error(`Missing required tables: ${missingTables.join(', ')}`));
            } else {
                resolve({
                    valid: true,
                    requiredTables: REQUIRED_TABLES.length,
                    optionalTables: OPTIONAL_TABLES.filter(table => tableNames.includes(table)).length,
                    totalTables: tableNames.length
                });
            }
        });
    });
}

/**
 * Performance monitoring wrapper
 */
function withPerformanceMonitoring(operation, queryName) {
    if (!DB_CONFIG.logging.logPerformance) {
        return operation;
    }
    
    return async (...args) => {
        const startTime = Date.now();
        
        try {
            const result = await operation(...args);
            const duration = Date.now() - startTime;
            
            if (duration > DB_CONFIG.logging.slowQueryThreshold) {
                console.warn(`⚠️  Slow query detected: ${queryName} took ${duration}ms`);
            } else if (DB_CONFIG.logging.logQueries) {
                console.log(`📊 Query: ${queryName} completed in ${duration}ms`);
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Query failed: ${queryName} after ${duration}ms -`, error.message);
            throw error;
        }
    };
}

module.exports = {
    DB_CONFIG,
    getDatabasePath,
    getBackupPath,
    getSQLitePragmas,
    validateSchema,
    withPerformanceMonitoring,
    REQUIRED_TABLES,
    OPTIONAL_TABLES
};