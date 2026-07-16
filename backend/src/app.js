const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload
const upload = multer({ dest: 'uploads/' });

// In-memory storage for demo (in real app use database)
let users = [];
let predictions = [];

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'AgroLens Backend',
        timestamp: new Date().toISOString()
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid email or password'
        });
    }
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        res.status(409).json({
            success: false,
            error: 'User already exists'
        });
    } else {
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password
        };
        users.push(newUser);
        res.json({
            success: true,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    }
});

// Prediction endpoint
app.post('/api/predict', upload.single('image'), async (req, res) => {
    let filePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image uploaded'
            });
        }

        filePath = req.file.path;

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        console.log('📤 Sending to FastAPI on port 5001...');
        
        const response = await axios.post('http://localhost:5001/predict', formData, {
            headers: { ...formData.getHeaders() },
            timeout: 30000
        });

        console.log('✅ Prediction received');
        fs.unlinkSync(filePath);

        // Save prediction to history
        if (response.data.success) {
            const predictionEntry = {
                id: Date.now().toString(),
                ...response.data.data,
                timestamp: new Date().toISOString()
            };
            predictions.unshift(predictionEntry);
            predictions = predictions.slice(0, 50); // Keep last 50 predictions
        }

        res.json(response.data);
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Prediction failed'
        });
    }
});

// History endpoint
app.get('/api/history', (req, res) => {
    res.json({
        success: true,
        history: predictions
    });
});

// Profile endpoint
app.get('/api/profile', (req, res) => {
    // For demo, return first user or dummy profile
    const profile = users.length > 0 ? users[0] : { id: 'demo', name: 'Demo User', email: 'demo@agrolens.com' };
    res.json({
        success: true,
        profile: { id: profile.id, name: profile.name, email: profile.email }
    });
});

console.log('🚀 Starting AgroLens Backend...');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Android Emulator should use: http://192.168.7.176:3000:${PORT}`);
});
