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


// Garage gate


// Middleware to parse JSON
app.use(bodyParser.json());

// Initialize SQLite Database
const db = new sqlite3.Database('garage.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database connected');
    }
});

// Create table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS garage (
        id INTEGER PRIMARY KEY,
        gateStatus INTEGER NOT NULL,
        garageCode TEXT NOT NULL
    )
`);

// Endpoint to get the current garage gate status and code
app.get('/api/garage', (req, res) => {
    db.get('SELECT gateStatus, garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch data' });
        } else if (row) {
            res.json(row);
        } else {
            // Default values if the garage data doesn't exist
            res.json({ gateStatus: 0, garageCode: '1234' });
        }
    });
});

// Endpoint to update the gate status
app.post('/api/garage/status', (req, res) => {
    const { gateStatus } = req.body;
    db.run('UPDATE garage SET gateStatus = ? WHERE id = 1', [gateStatus], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to update gate status' });
        } else {
            res.json({ success: true });
        }
    });
});

// Endpoint to update the garage code
app.post('/api/garage/code', (req, res) => {
    const { oldCode, newCode } = req.body;
    db.get('SELECT garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch garage code' });
        } else if (row && row.garageCode === oldCode) {
            db.run('UPDATE garage SET garageCode = ? WHERE id = 1', [newCode], function(err) {
                if (err) {
                    res.status(500).json({ error: 'Failed to update garage code' });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.status(400).json({ error: 'Old code is incorrect' });
        }
    });

    
//Garage lights:

    // Create table if not exists for garage lights
db.run(`
    CREATE TABLE IF NOT EXISTS garage_lights (
        id INTEGER PRIMARY KEY,
        position INTEGER NOT NULL,
        brightness REAL NOT NULL
    )
`);

// Set initial values if the table is empty
db.get('SELECT * FROM garage_lights WHERE id = 1', (err, row) => {
    if (err) {
        console.error('Error fetching data:', err);
    } else if (!row) {
        // Insert initial default values if no data exists
        db.run('INSERT INTO garage_lights (id, position, brightness) VALUES (1, 0, 0)');
    }
});

// Endpoint to get the current garage light position and brightness
app.get('/api/garage/lights', (req, res) => {
    db.get('SELECT position, brightness FROM garage_lights WHERE id = 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch light data' });
        } else if (row) {
            res.json(row);
        } else {
            res.json({ position: 0, brightness: 0 });
        }
    });
});

// Endpoint to update the garage light position and brightness
app.post('/api/garage/lights', (req, res) => {
    const { position, brightness } = req.body;
    db.run('UPDATE garage_lights SET position = ?, brightness = ? WHERE id = 1', [position, brightness], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to update light data' });
        } else {
            res.json({ success: true });
        }
    });
});
});


// LivingLights

// SQLite Database Setup
const db = new sqlite3.Database('./livinglighs.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Initialize the brightness table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS living_lights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brightness REAL
        )
    `);
    db.run(`
        INSERT OR IGNORE INTO living_lights (id, brightness) VALUES (1, 0.5)
    `); // Default brightness is 50%
});

// GET: Fetch current brightness
app.get('/api/living-lights', (req, res) => {
    db.get('SELECT brightness FROM living_lights WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Error fetching brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(row || { brightness: 0 });
        }
    });
});

// POST: Update brightness
app.post('/api/living-lights', (req, res) => {
    const { brightness } = req.body;

    if (typeof brightness !== 'number' || brightness < 0 || brightness > 1) {
        return res.status(400).json({ error: 'Invalid brightness value' });
    }

    db.run('UPDATE living_lights SET brightness = ? WHERE id = 1', [brightness], (err) => {
        if (err) {
            console.error('Error updating brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Brightness updated successfully' });
        }
    });
});

// code computer
// Variabele om de status van de computer bij te houden
let computerState = false; // false betekent dat de computer uit staat, true betekent dat de computer aan staat

// Eindpunt om de huidige computerstatus op te halen
app.get('/api/computer-state', (req, res) => {
    res.json({ computerOn: computerState });
});

// Eindpunt om de computer aan te zetten
app.post('/api/start', (req, res) => {
    computerState = true;  // Zet de computerstatus op "aan"
    res.json({ success: true, message: "Computer started" });
});

// Eindpunt om de computer uit te zetten
app.post('/api/shutdown', (req, res) => {
    computerState = false; // Zet de computerstatus op "uit"
    res.json({ success: true, message: "Computer shut down" });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

