import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const DEFAULT_DIR = path.resolve(__dirname, '../uploads');
const STORAGE_LOCAL_PATH = process.env.STORAGE_LOCAL_PATH || DEFAULT_DIR;
const MAX_FILE_SIZE_MB = process.env.STORAGE_MAX_FILE_SIZE_MB ? Number(process.env.STORAGE_MAX_FILE_SIZE_MB) : 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_LOCAL_PATH)) {
  fs.mkdirSync(STORAGE_LOCAL_PATH, { recursive: true });
}

// Simple filename sanitizer: keep alnum, dot, dash, underscore; replace others
function sanitizeOriginalName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

const allowedMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_LOCAL_PATH);
  },
  filename: (_req, file, cb) => {
    const original = sanitizeOriginalName(file.originalname || 'file');
    const ext = path.extname(original) || '';
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter: multer.FileFilterCallback = (req, file, cb) => {
  if (allowedMimes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF/DOC/DOCX allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default upload;