const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
