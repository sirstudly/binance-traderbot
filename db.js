import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// Initialize database
async function initializeDatabase() {
    try {
        db = await open({
            filename: path.join(__dirname, 'credentials.db'),
            driver: sqlite3.Database
        });

        // Create credentials table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key TEXT NOT NULL,
                api_secret TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

// Get the latest API credentials
async function getCredentials() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    const credentials = await db.get('SELECT api_key, api_secret FROM credentials ORDER BY id DESC LIMIT 1');
    return credentials;
}

// Add new API credentials
async function addCredentials(apiKey, apiSecret, token, name = '') {
    if (!db) {
        throw new Error('Database not initialized');
    }
    try {
        const result = await db.run(
            'INSERT INTO credentials (api_key, api_secret, token, name) VALUES (?, ?, ?, ?)',
            [apiKey, apiSecret, token, name]
        );
        return { success: true, id: result.lastID };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all credentials (for admin purposes)
async function getAllCredentials() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    try {
        const credentials = await db.all('SELECT * FROM credentials ORDER BY id DESC');
        return credentials;
    } catch (error) {
        console.error('Error getting all credentials:', error);
        return [];
    }
}

// Delete credentials by ID
async function deleteCredentials(id) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    try {
        const result = await db.run('DELETE FROM credentials WHERE id = ?', [id]);
        return { success: true, changes: result.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Close database connection
async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
    }
}

// Initialize database and export functions
const dbModule = {
    initialize: initializeDatabase,
    getCredentials,
    addCredentials,
    getAllCredentials,
    deleteCredentials,
    close: closeDatabase
};

export default dbModule;