const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Config
const PUBLIC_DIR = path.resolve(path.join(__dirname, 'public')); // siempre ./public
const TOKEN = process.env.UPLOAD_TOKEN || '';
const MAX_SIZE = 25 * 1024 * 1024; // 25MB fijo

// Ensure public dir exists
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const app = express();

// Auth middleware (Bearer token en Authorization)
function requireToken(req, res, next) {
    if (!TOKEN) return res.status(500).json({ error: 'Token no configurado en el servidor' });
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const provided = match ? match[1] : '';
    if (!provided || provided !== TOKEN) return res.status(401).json({ error: 'Token inválido' });
    next();
}

// Multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PUBLIC_DIR),
    filename: (_req, file, cb) => {
        cb(null, 'latest.pdf');
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se aceptan PDFs'));
    }
});

// 404 for all other routes: respond with 404 and no content
app.use((req, res) => {
    res.status(404).end();
});

// Create a router for /cv
const cvRouter = express.Router();

// Upload endpoint under /cv/upload
cvRouter.post('/upload', requireToken, upload.single('file'), (req, res) => {
    const fileName = path.basename(req.file.filename);
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ id: fileName.replace(/\.pdf$/i, ''), url: `${baseUrl}/cv/${fileName}` });
});

// Static serving under /cv (e.g., /cv/latest.pdf)
cvRouter.use('/', express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
        res.setHeader('Cache-Control', 'no-store');
    }
}));

// Mount the router at /cv
app.use('/cv', cvRouter);

app.listen(3000, () => {
    console.log(`PDF service listening on http://0.0.0.0:3000`);
});
 