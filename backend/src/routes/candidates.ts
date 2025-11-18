import express from 'express';
import path from 'path';
import fs from 'fs';
import upload from '../middleware/upload';
import { createCandidate, autocompleteCandidates } from '../controllers/candidatesController';

const router = express.Router();

// NOTE: upload middleware handles uploads dir creation and validation.

// POST /api/candidates (multipart/form-data)
router.post('/', upload.single('cv'), createCandidate);

// GET /api/candidates/autocomplete?q=...
router.get('/autocomplete', autocompleteCandidates);

export default router;