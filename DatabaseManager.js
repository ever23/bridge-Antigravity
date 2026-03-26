const path = require('path');
const sqlite3Tab = require('sqlite3-tab');

class DatabaseManager {
    constructor(extensionPath) {
        this.dbPath = path.join(extensionPath, 'antigravity.sqlite');
        this.modelPath = path.join(extensionPath, 'model');
        this.db = null;
        this.historyTable = null;
    }

    async init() {
        console.log(`[DB] initializing at ${this.dbPath}`);
        this.db = new sqlite3Tab(this.dbPath);
        this.db.pathModels(this.modelPath);
        this.historyTable = this.db.tabla('chat_history');
        return this.historyTable;
    }

    getHistory() {
        return this.historyTable.select(null, null, null, null, null, null, "id ASC", 50);
    }

    async saveMessage(role, content) {
        try {
            await this.historyTable.insert({ role, content });
        } catch (err) {
            console.error('[DB] Error saving message:', err);
        }
    }
}

module.exports = DatabaseManager;
