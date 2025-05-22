import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
async function initializeDatabase() {
    const db = await open({
        filename: path.join(__dirname, 'credentials.db'),
        driver: sqlite3.Database
    });

    // Create credentials table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key TEXT NOT NULL,
            api_secret TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

// Get the latest API credentials
async function getCredentials() {
    const db = await initializeDatabase();
    const credentials = await db.get('SELECT api_key, api_secret FROM credentials ORDER BY id DESC LIMIT 1');
    await db.close();
    return credentials;
}

// Add new API credentials
async function addCredentials(apiKey, apiSecret) {
    const db = await initializeDatabase();
    try {
        const result = await db.run(
            'INSERT INTO credentials (api_key, api_secret) VALUES (?, ?)',
            [apiKey, apiSecret]
        );
        return { success: true, id: result.lastID };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await db.close();
    }
}

// Get all credentials (for admin purposes)
async function getAllCredentials() {
    const db = await initializeDatabase();
    try {
        const credentials = await db.all('SELECT id, api_key, api_secret, created_at, updated_at FROM credentials ORDER BY id DESC');
        return credentials;
    } finally {
        await db.close();
    }
}

// Delete credentials by ID
async function deleteCredentials(id) {
    const db = await initializeDatabase();
    try {
        const result = await db.run('DELETE FROM credentials WHERE id = ?', [id]);
        return { success: true, changes: result.changes };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await db.close();
    }
}

// Initialize database and export functions
const db = {
    getCredentials,
    addCredentials,
    getAllCredentials,
    deleteCredentials
};

export default db; 