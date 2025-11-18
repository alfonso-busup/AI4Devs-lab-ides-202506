import request from 'supertest';
import prisma, { app } from '../index';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const uploadsDir = path.resolve(__dirname, '../../uploads');

async function clearUploadsDir() {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const files = await readdir(uploadsDir);
    await Promise.all(files.map((f) => unlink(path.join(uploadsDir, f))));
  } catch (e) {
    // ignore
  }
}

beforeAll(async () => {
  // ensure uploads dir exists and is empty
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  await clearUploadsDir();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearUploadsDir();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await clearUploadsDir();
  // Do not disconnect prisma here because the app bootstrap may manage lifecycle
});

describe('Candidates API - validation & upload', () => {
  it('POST /api/candidates - success (multipart + file) -> 201', async () => {
    // mock DB lookups/creates
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValue(null as any);
    const mockCreated = {
      id: 'uuid-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: null,
      address: null,
      education: null,
      workExperience: null,
      cvFileName: 'resume.pdf',
      cvMimeType: 'application/pdf',
      cvPath: path.join(uploadsDir, 'dummy.pdf'),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue(mockCreated);

    // create a small temp pdf to upload
    const tempPdf = path.join(__dirname, 'temp_upload.pdf');
    await writeFile(tempPdf, '%PDF-1.4\n%EOF');

    const res = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Alice')
      .field('lastName', 'Smith')
      .field('email', 'alice@example.com')
      .attach('cv', tempPdf);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.email).toBe('alice@example.com');

    // cleanup local temp file
    try { await unlink(tempPdf); } catch {}
  });

  it('POST /api/candidates - validation error (missing required) -> 400', async () => {
    // No DB calls expected
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValue(null as any);

    const res = await request(app)
      .post('/api/candidates')
      .send({ firstName: 'OnlyFirst' }) // missing lastName & email
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('POST /api/candidates - duplicate email -> 409 and uploaded file cleaned up', async () => {
    // Simulate duplicate: findUnique returns an existing record
    const existing = { id: 'existing-1', email: 'dup@example.com' } as any;
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValue(existing);
    // create should not be called
    const createSpy = jest.spyOn(prisma.candidate, 'create');

    // create temp pdf
    const tempPdf = path.join(__dirname, 'temp_dup.pdf');
    await writeFile(tempPdf, '%PDF-1.4\n%EOF');

    const res = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Dup')
      .field('lastName', 'User')
      .field('email', 'dup@example.com')
      .attach('cv', tempPdf);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(createSpy).not.toHaveBeenCalled();

    // Uploaded file should have been removed by controller cleanup logic.
    // Assert uploads dir is empty (controller attempts unlink)
    const files = fs.existsSync(uploadsDir) ? await readdir(uploadsDir) : [];
    expect(files.length).toBe(0);

    // cleanup temp file
    try { await unlink(tempPdf); } catch {}
  });

  it('POST /api/candidates - bad file type -> failure (>=400) and JSON error', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValue(null as any);

    const tempTxt = path.join(__dirname, 'temp.txt');
    await writeFile(tempTxt, 'just some text');

    const res = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Bad')
      .field('lastName', 'File')
      .field('email', 'badfile@example.com')
      .attach('cv', tempTxt);

    // Depending on middleware error mapping this can be 400 or 500.
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('error');

    // cleanup temp file
    try { await unlink(tempTxt); } catch {}
  });

  it('POST /api/candidates - server error simulation (DB throws) -> 500', async () => {
    // findUnique ok
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValue(null as any);
    // create throws to simulate server error
    jest.spyOn(prisma.candidate, 'create').mockImplementation(() => {
      throw new Error('simulated db failure');
    });

    const tempPdf = path.join(__dirname, 'temp_server_err.pdf');
    await writeFile(tempPdf, '%PDF-1.4\n%EOF');

    const res = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Server')
      .field('lastName', 'Error')
      .field('email', 'servererr@example.com')
      .attach('cv', tempPdf);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');

    // cleanup temp file
    try { await unlink(tempPdf); } catch {}
  });
});
