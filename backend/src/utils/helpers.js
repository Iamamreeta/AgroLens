const fs = require('fs');
const path = require('path');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const sanitizeFilename = (filename) => {
  return String(filename)
    .replace(/[^a-z0-9.\-_ ]/gi, '')
    .replace(/\s+/g, '_');
};

const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn('⚠️  Failed to delete file:', filePath, err.message);
  }
  return false;
};

const formatDateParts = (isoDate = new Date()) => {
  const d = new Date(isoDate);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().split(' ')[0],
  };
};

const arrayToText = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value.join('\n');
  return String(value);
};

const textToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
};

module.exports = {
  ensureDir,
  sanitizeFilename,
  deleteFile,
  formatDateParts,
  arrayToText,
  textToArray,
};
