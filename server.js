// server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const cors = require('cors');

const app = express();
const port = 3000;

// Configure middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize SQLite database
const db = new sqlite3.Database('./logs.db');

// Promisify database methods for async/await
db.run = promisify(db.run);
db.all = promisify(db.all);

// Create logs table if not exists
const initializeDatabase = async () => {
    try {
        await db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        timestamp TEXT
      )
    `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

initializeDatabase();

// POST endpoint to create log
app.post('/logs', async (req, res) => {
    try {
        const { log } = req.body;

        if (!log) {
            return res.status(400).json({ error: 'Log message is required' });
        }

        const timestamp = new Date().toISOString();
        await db.run(
            'INSERT INTO logs (message, timestamp) VALUES (?, ?)',
            [log, timestamp]
        );

        res.status(201).json({
            message: 'Log created successfully',
            log: {
                message: log,
                timestamp
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET endpoint to retrieve all logs
app.get('/logs', async (req, res) => {
    try {
        const logs = await db.all('SELECT * FROM logs ORDER BY timestamp DESC');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Logging service running on port ${port}`);
});