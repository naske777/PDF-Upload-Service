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

// Multer storage: always save as latest.pdf, versioning handled in endpoint
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PUBLIC_DIR),
    filename: (_req, _file, cb) => {
        cb(null, 'latest.pdf');
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are accepted'));
    }
});

// Create a router for /cv
const cvRouter = express.Router();


// Upload endpoint under /cv/upload
cvRouter.post('/upload', requireToken, upload.single('file'), async (req, res) => {
    const fsPromises = require('fs').promises;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    let nextPatch = 1, major = 1, minor = 0;
    try {
        const files = await fsPromises.readdir(PUBLIC_DIR);
        const versions = files
            .map(f => /^v-(\d+)\.(\d+)\.(\d+)\.pdf$/.exec(f))
            .filter(Boolean)
            .map(match => ({
                major: parseInt(match[1], 10),
                minor: parseInt(match[2], 10),
                patch: parseInt(match[3], 10)
            }));
        if (versions.length > 0) {
            // Find the highest version
            const latest = versions.reduce((a, b) => {
                if (a.major !== b.major) return a.major > b.major ? a : b;
                if (a.minor !== b.minor) return a.minor > b.minor ? a : b;
                return a.patch > b.patch ? a : b;
            });
            major = latest.major;
            minor = latest.minor;
            nextPatch = latest.patch + 1;
        }
    } catch (e) {}

    const versionString = `${major}.${minor}.${nextPatch}`;
    const src = path.join(PUBLIC_DIR, 'latest.pdf');
    const dest = path.join(PUBLIC_DIR, `v-${versionString}.pdf`);
    try {
        await fsPromises.copyFile(src, dest);
    } catch (e) {
        return res.status(500).json({ error: 'Failed to save versioned file' });
    }

    res.json({
        latest: `${baseUrl}/cv/latest.pdf`,
        versioned: `${baseUrl}/cv/v-${versionString}.pdf`,
        version: versionString
    });
});

// Custom handler for PDF viewing with version in page title
cvRouter.get(['/latest.pdf', '/v-:major.:minor.:patch.pdf'], async (req, res, next) => {
    const accept = req.headers.accept || '';
    const isHtml = accept.includes('text/html');
    let fileName, version;
    if (req.params.major && req.params.minor && req.params.patch) {
        version = `v-${req.params.major}.${req.params.minor}.${req.params.patch}.pdf`;
        fileName = path.join(PUBLIC_DIR, version);
    } else {
        version = 'latest.pdf';
        fileName = path.join(PUBLIC_DIR, version);
    }
    if (isHtml) {
        // Serve HTML wrapper with title
        return res.send(`<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>${version}</title>
  <style>body,html{margin:0;padding:0;height:100%;}iframe{border:0;width:100vw;height:100vh;}</style>
</head>
<body>
  <iframe src=\"${encodeURI(req.originalUrl)}?raw=1\" allowfullscreen></iframe>
</body>
</html>`);
    }
    // If ?raw=1 or Accept is not html, serve the PDF file
    if (req.query.raw === '1' || !isHtml) {
        if (!fs.existsSync(fileName)) return res.status(404).end();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=\"${version}\"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(fileName);
    }
    next();
});

// Mount the router at /cv
app.use('/cv', cvRouter);

// 404 for all other routes: respond with 404 and no content
app.use((req, res) => {
    res.status(404).end();
});

app.listen(3000, () => {
    console.log(`PDF service listening on http://0.0.0.0:3000`);
});
 