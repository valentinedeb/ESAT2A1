
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();


app.use(bodyParser.json());
app.use(cors());


const db = new sqlite3.Database('./alarmSystem.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});


db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarmCode TEXT NOT NULL,
    alarmStatus INTEGER NOT NULL
)`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});


app.get('/api/settings', (req, res) => {
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err || !row) {
            // Insert default values if no settings exist
            db.run('INSERT INTO settings (alarmCode, alarmStatus) VALUES (?, ?)', ['1234', 0], function (err) {
                if (err) {
                    res.status(500).json({ error: 'Failed to insert default settings' });
                    return;
                }
                res.json({ alarmCode: '1234', alarmStatus: 0 });
            });
        } else {
            res.json(row);
        }
    });
});


app.post('/api/settings/status', (req, res) => {
    const { alarmCode } = req.body;

    
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err || !row) {
            return res.status(500).json({ error: 'Settings not found' });
        }

        if (alarmCode === row.alarmCode) {
            const newStatus = row.alarmStatus === 0 ? 1 : 0;

            db.run('UPDATE settings SET alarmStatus = ? WHERE id = 1', [newStatus], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update alarm status' });
                }
                res.json({ alarmStatus: newStatus });
            });
        } else {
            res.status(403).json({ error: 'Incorrect code' });
        }
    });
});


app.post('/api/settings/update', (req, res) => {
    const { oldAlarmCode, newAlarmCode } = req.body;

    
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err || !row) {
            return res.status(500).json({ error: 'Settings not found' });
        }

        if (oldAlarmCode === row.alarmCode && newAlarmCode) {
            db.run('UPDATE settings SET alarmCode = ? WHERE id = 1', [newAlarmCode], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update alarm code' });
                }
                res.json({ message: 'Alarm code updated successfully' });
            });
        } else {
            res.status(400).json({ error: 'Incorrect old code or invalid new code' });
        }
    });
});


const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
