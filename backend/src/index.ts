import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { app, default as prisma } from './app';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3010;

// Note: app already has json/urlencoded, cors, helmet and routes mounted.

// Improved error handler: map Multer errors to 413/400 and return JSON messages
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err && err.stack ? err.stack : err);

  if (err instanceof multer.MulterError || err?.code !== undefined) {
    const code = err.code || (err instanceof multer.MulterError && err.code);
    if (code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Uploaded file too large' });
    }
    return res.status(400).json({ error: err.message || 'Invalid file upload' });
  }

  res.type('application/json');
  res.status(500).json({ error: 'Internal server error' });
});

// --- Prisma lifecycle & graceful shutdown ---
async function startServer() {
  try {
    await prisma.$connect();
    console.log('Prisma connected.');

    const server = app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    const shutdown = async (signal?: string) => {
      try {
        console.log(`Received ${signal ?? 'shutdown'} signal. Closing server...`);
        server.close(async (err) => {
          if (err) {
            console.error('Error closing server', err);
            process.exit(1);
          }
          try {
            await prisma.$disconnect();
            console.log('Prisma disconnected. Exiting.');
            process.exit(0);
          } catch (disconnectErr) {
            console.error('Error disconnecting Prisma', disconnectErr);
            process.exit(1);
          }
        });

        setTimeout(() => {
          console.warn('Forcing shutdown due to timeout.');
          process.exit(1);
        }, 30_000).unref();
      } catch (e) {
        console.error('Error during shutdown', e);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception', err);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection', reason);
      shutdown('unhandledRejection');
    });
  } catch (err) {
    console.error('Failed to start server', err);
    try {
      await prisma.$disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

startServer();
