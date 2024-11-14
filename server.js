const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const path = require('path');

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

// Kitchen-lights code
// Function to initialize the database and ensure the table exists
function initializeDatabase() {
    const db = new sqlite3.Database(path.join(__dirname, 'kitchenlights.db'), (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Database connected');
        }
    });

    // Create the table if it doesn't exist
    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS kitchen_lights (id INTEGER PRIMARY KEY, brightness INTEGER)');
        db.get('SELECT COUNT(*) AS count FROM kitchen_lights', (err, row) => {
            if (row.count === 0) {
                // Insert initial brightness value (e.g., 0)
                db.run('INSERT INTO kitchen_lights (brightness) VALUES (0)');
            }
        });
    });

    return db;
}

// API to fetch the current brightness
app.get('/api/kitchen-lights', (req, res) => {
    const db = initializeDatabase();

    db.get('SELECT brightness FROM kitchen_lights WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Error fetching brightness:', err);
            return res.status(500).send('Server error');
        }
        // If no value is found, return the default brightness of 0
        res.json({ brightness: row ? row.brightness : 0 });
    });
});

// API to update the brightness
app.post('/api/kitchen-lights', (req, res) => {
    const { brightness } = req.body;

    if (brightness === undefined || isNaN(brightness)) {
        return res.status(400).send('Invalid brightness value');
    }

    const db = initializeDatabase();

    db.run('UPDATE kitchen_lights SET brightness = ? WHERE id = 1', [brightness], function(err) {
        if (err) {
            console.error('Error updating brightness:', err);
            return res.status(500).send('Server error');
        }
        res.send({ message: 'Brightness updated successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

