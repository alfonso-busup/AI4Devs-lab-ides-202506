import { Request, Response } from 'express';
import prisma from '../index';
import path from 'path';
import fs from 'fs';

type CandidateInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  education?: any;
  workExperience?: any;
};

// --- Added/updated helpers for validation & sanitization ---
function sanitizeString(input = ''): string {
  return String(input).trim().replace(/<[^>]*>/g, ''); // strip simple tags
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^\+?[0-9\s\-().]{7,30}$/.test(phone);
}

function tooLong(field: string, max: number) {
  return field.length > max;
}

// --- Updated controller with stricter validation & clear error responses ---
export async function createCandidate(req: Request, res: Response) {
  try {
    const body = req.body || {};

    // sanitize inputs
    const firstName = sanitizeString(body.firstName || '');
    const lastName = sanitizeString(body.lastName || '');
    const email = sanitizeString(body.email || '');
    const phone = sanitizeString(body.phone || '');
    const address = sanitizeString(body.address || '');

    // Basic required checks
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName and email are required' });
    }

    // Basic format checks
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }

    // Length constraints to avoid DoS / DB abuse
    if (tooLong(firstName, 100) || tooLong(lastName, 100)) {
      return res.status(400).json({ error: 'firstName/lastName too long (max 100 chars)' });
    }
    if (tooLong(email, 254)) {
      return res.status(400).json({ error: 'email too long' });
    }
    if (address && tooLong(address, 2000)) {
      return res.status(400).json({ error: 'address too long' });
    }

    // Parse JSON fields if provided (multipart might send them as strings)
    let education: any = null;
    let workExperience: any = null;
    if (body.education) {
      try {
        education = typeof body.education === 'string' ? JSON.parse(body.education) : body.education;
      } catch {
        education = sanitizeString(String(body.education)).slice(0, 5000);
      }
    }
    if (body.workExperience) {
      try {
        workExperience = typeof body.workExperience === 'string'
          ? JSON.parse(body.workExperience)
          : body.workExperience;
      } catch {
        workExperience = sanitizeString(String(body.workExperience)).slice(0, 5000);
      }
    }

    // Handle file metadata (multer already enforces type/size)
    let cvFileName: string | null = null;
    let cvMimeType: string | null = null;
    let cvPath: string | null = null;

    if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File;
      cvFileName = sanitizeString(file.originalname);
      cvMimeType = sanitizeString(file.mimetype);
      cvPath = sanitizeString(file.path);
    }

    // Duplicate email check -> 409
    const existing = await prisma.candidate.findUnique({ where: { email } });
    if (existing) {
      // cleanup uploaded file if present
      if (cvPath && fs.existsSync(cvPath)) {
        try { fs.unlinkSync(cvPath); } catch (e) { console.error('unlink error', e); }
      }
      return res.status(409).json({ error: 'Candidate with that email already exists' });
    }

    // Create record
    const created = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        education: education ?? null,
        workExperience: workExperience ?? null,
        cvFileName,
        cvMimeType,
        cvPath,
      },
    });

    return res.status(201).json({ data: created, message: 'Candidate created' });
  } catch (err: any) {
    console.error('createCandidate error', err);
    // If multer error propagated here, let global error handler handle it; otherwise 500
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function autocompleteCandidates(req: Request, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const term = q.trim();

    const results = await prisma.candidate.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10,
    });

    return res.json(results);
  } catch (err) {
    console.error('autocompleteCandidates error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}