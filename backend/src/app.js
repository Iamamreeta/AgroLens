const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'AgroLens Backend',
        timestamp: new Date().toISOString()
    });
});

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

        console.log('📤 Sending to FastAPI on port 5002...');
        
        const response = await axios.post('http://localhost:5001/predict', formData, {
            headers: { ...formData.getHeaders() },
            timeout: 30000
        });

        console.log('✅ Prediction received');
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            data: response.data
        });

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

console.log('🚀 Starting AgroLens Backend...');

app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});