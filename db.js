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

// Initialize database and export functions
const db = {
    getCredentials
};

export default db; 