const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

// Enable CORS to allow the front-end to make requests
app.use(cors());

// Middleware to parse JSON bodies in requests
app.use(express.json());

// Dummy data for the alarm system
let settings = {
    alarmCode: '1234',
    alarmStatus: false
};

// Route to get the settings
app.get('/api/settings', (req, res) => {
    res.json(settings);
});

// SQLite database setup
const db = new sqlite3.Database('./cameraData.db')

// Route to update the alarm status
app.post('/api/settings/status', (req, res) => {
    const { alarmCode } = req.body;
    if (alarmCode === settings.alarmCode) {
        settings.alarmStatus = !settings.alarmStatus;
        res.json({ alarmStatus: settings.alarmStatus });
    } else {
        res.status(401).json({ message: 'Incorrect code' });
    }
});

// Route to update the alarm code
app.post('/api/settings/update', (req, res) => {
    const { oldAlarmCode, newAlarmCode } = req.body;
    if (oldAlarmCode === settings.alarmCode) {
        settings.alarmCode = newAlarmCode;
        res.json({ message: 'Alarm code updated successfully' });
    } else {
        res.status(401).json({ message: 'Old code is incorrect' });
    }
});

// Camera code
// Initialize database schema (if not already present)
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS camera_data (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// API endpoint to store camera data (status)
app.post('/api/camera', (req, res) => {
    const { status } = req.body;

    if (status) {
        const stmt = db.prepare("INSERT INTO camera_data (status) VALUES (?)");
        stmt.run(status, function (err) {
            if (err) {
                return res.status(500).send({ error: 'Failed to save camera status' });
            }
            res.status(200).send({ message: 'Camera status saved', id: this.lastID });
        });
        stmt.finalize();
    } else {
        res.status(400).send({ error: 'Invalid status' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

