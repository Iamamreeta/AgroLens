const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureDir, sanitizeFilename } = require('../utils/helpers');

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
ensureDir(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const rand = Math.round(Math.random() * 1e9);
    const safe = sanitizeFilename(file.originalname || 'photo.jpg');
    const ext = path.extname(safe) || '.jpg';
    const base = path.basename(safe, ext).slice(0, 30);
    cb(null, `${ts}-${rand}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype?.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
    files: 1,
  },
});

module.exports = {
  upload,
  uploadSingle: upload.single('image'),
};
