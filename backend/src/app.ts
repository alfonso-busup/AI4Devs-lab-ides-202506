import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import candidatesRouter from './routes/candidates';

dotenv.config();

const prisma = new PrismaClient();
export default prisma;

export const app = express();

// Security headers
app.use(helmet());

// CORS: allow frontend origin in dev (fallback to localhost:3000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients or same-origin requests
      if (!origin || origin === frontendOrigin) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/candidates', candidatesRouter);

// Basic health endpoint
app.get('/', (_req, res) => {
  res.send('Hola LTI!');
});