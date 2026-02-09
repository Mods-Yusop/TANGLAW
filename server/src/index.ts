import express from 'express';
import path from 'path';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import selfsigned from 'selfsigned';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import studentRoutes from './routes/student.routes';
import transactionRoutes from './routes/transaction.routes';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
import auditRoutes from './routes/audit.routes';
import sessionRoutes from './routes/session.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();

// Initialize IO detached (safe for imports)
export const io = new SocketIOServer({
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"],
    credentials: true
  }
});

export let server: https.Server;

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/session/import', express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- SERVE FRONTEND (Production Mode) ---
const distPath = path.join(process.cwd(), '../client/dist');

if (fs.existsSync(distPath)) {
  console.log('📦 Hosting React Frontend from:', distPath);
  app.use(express.static(distPath));

  // Serve index.html for any unknown routes (Client-side routing)
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).send('API Not Found');
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`TANGLAW POS API (Dev Mode) - Frontend not built. <br> Checked path: ${distPath}`);
  });
}

// Async Bootstrap
async function bootstrap() {
  try {
    // --- SSL Certificate Generation ---
    let pems: { private: string; cert: string };
    const certPath = './cert.pem';
    const keyPath = './key.pem';

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      pems = {
        cert: fs.readFileSync(certPath, 'utf8'),
        private: fs.readFileSync(keyPath, 'utf8')
      };
    } else {
      console.log('Generating Self-Signed Certificate...');
      const attrs = [{ name: 'commonName', value: 'localhost' }];
      // @ts-ignore
      const generated = await selfsigned.generate(attrs, { days: 365 });
      pems = {
        cert: generated.cert,
        private: generated.private
      };
      fs.writeFileSync(certPath, pems.cert);
      fs.writeFileSync(keyPath, pems.private);
      console.log('Certificate generated successfully.');
    }

    // Create HTTPS Server
    server = https.createServer({
      key: pems.private,
      cert: pems.cert
    }, app);

    // Attach IO
    io.attach(server);

    // Database
    await prisma.$connect();
    console.log('Connected to Database');

    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server is running on HTTPS port ${PORT}`);

      // Auto-Fix Admin PIN
      try {
        const admin = await prisma.staff.findFirst({ where: { role: 'ADMIN' } });
        if (admin) {
          const isMatch = await bcrypt.compare('024434', admin.password);
          if (!isMatch) {
            console.log('⚠️  Admin PIN mismatch detected. Auto-fixing to default...');
            const newHash = await bcrypt.hash('024434', 10);
            await prisma.staff.update({
              where: { id: admin.id },
              data: { password: newHash }
            });
            console.log('✅ Admin PIN auto-corrected to 024434');
          } else {
            console.log('✅ Admin PIN is correct.');
          }
        }
      } catch (err) {
        console.error('Failed to auto-check Admin PIN:', err);
      }
    });

  } catch (err) {
    console.error('Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

// Keep process alive hack
setInterval(() => { }, 10000);
